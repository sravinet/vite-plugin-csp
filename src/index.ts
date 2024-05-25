import { Plugin } from 'vite'
import path from 'node:path'
import fs from 'fs/promises'
import { readJsonFile, writeJsonFile, ensureDirectoryExists, getAllFiles, waitForFile } from '../utils/file-utils.mts'
import { extractExternalUrls, filterUrls } from './utils/url-utils'
import { generateCspHeader } from './utils/csp-utils.mjs'

/**
 * Interface representing the Remix manifest.
 */
interface RemixManifest {
  routes: Record<string, { file: string; path?: string; id: string }>
}

/**
 * Interface representing the Client manifest.
 */
interface ClientManifest {
  [key: string]: { src: string; file: string; imports?: string[] }
}

/**
 * Maps routes to their corresponding assets.
 * 
 * @param {RemixManifest} remixManifest - The Remix manifest.
 * @param {ClientManifest} clientManifest - The Client manifest.
 * @param {string} translationDir - The directory containing translation files.
 * @param {string} clientJSDir - The directory containing client JS files.
 * @param {string[]} allowedDomains - List of allowed domains.
 * @param {string[]} allowedUrls - List of allowed URLs.
 * @returns {Promise<Record<string, { assets: string[], externalUrls: Set<string>, removedUrls: Set<string> }>>} - A promise that resolves to a record of route assets.
 */
async function mapRoutesToAssets(
  remixManifest: RemixManifest,
  clientManifest: ClientManifest,
  translationDir: string,
  clientJSDir: string,
  allowedDomains: string[],
  allowedUrls: string[]
): Promise<Record<string, { assets: string[], externalUrls: Set<string>, removedUrls: Set<string> }>> {
  const routeAssets: Record<string, { assets: string[], externalUrls: Set<string>, removedUrls: Set<string> }> = {}
  const exemptUrls = new Set<string>()

  /**
   * Processes translation files to extract external URLs.
   * 
   * @param {string} dir - The directory containing translation files.
   */
  async function processTranslationFiles(dir: string) {
    const files = await getAllFiles(dir, '.json')
    await Promise.all(files.map(async (filePath) => {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      extractExternalUrls(fileContent).forEach(url => exemptUrls.add(url))
    }))
  }

  if (await fs.access(translationDir).then(() => true).catch(() => false)) {
    await processTranslationFiles(translationDir)
  }

  await Promise.all(Object.entries(remixManifest.routes).map(async ([routeKey, routeValue]) => {
    const assets = new Set<string>()
    const externalUrls = new Set<string>()
    const removedUrls = new Set<string>()

    /**
     * Collects assets for a given route file.
     * 
     * @param {string} routeFile - The route file.
     */
    function collectAssets(routeFile: string) {
      for (const asset of Object.values(clientManifest)) {
        if (asset.src === routeFile || asset.imports?.includes(routeFile)) {
          assets.add(asset.file)
          if (asset.imports) {
            asset.imports.forEach(imported => collectAssets(imported))
          }
        }
      }
    }

    collectAssets(routeValue.file)

    await Promise.all(Array.from(assets).map(async (asset) => {
      const assetFullPath = path.join(__dirname, 'public', asset)
      if (await fs.access(assetFullPath).then(() => true).catch(() => false)) {
        const fileContent = await fs.readFile(assetFullPath, 'utf-8')
        const { filteredUrls, removedUrls: fileRemovedUrls } = filterUrls(new Set(extractExternalUrls(fileContent)), exemptUrls, allowedDomains, allowedUrls)
        filteredUrls.forEach(url => externalUrls.add(url))
        fileRemovedUrls.forEach(url => removedUrls.add(url))
      }
    }))

    routeAssets[routeKey] = {
      assets: Array.from(assets),
      externalUrls,
      removedUrls
    }
  }))

  return routeAssets
}

/**
 * Vite plugin to generate CSP headers.
 * 
 * @param {Object} options - Plugin options.
 * @param {string} options.remixManifestPath - Path to the Remix manifest.
 * @param {string} options.clientManifestPath - Path to the Client manifest.
 * @param {string} options.translationDir - Directory containing translation files.
 * @param {string} options.clientJSDir - Directory containing client JS files.
 * @param {string} options.outputDir - Directory to output CSP headers.
 * @param {string[]} options.allowedDomains - List of allowed domains.
 * @param {string[]} options.allowedUrls - List of allowed URLs.
 * @param {boolean} [options.waitForManifests=false] - Whether to wait for manifests.
 * @param {boolean} [options.printRemovedUrls=false] - Whether to print removed URLs.
 * @returns {Plugin} - The Vite plugin.
 */
export default function cspPlugin(options: {
  remixManifestPath: string
  clientManifestPath: string
  translationDir: string
  clientJSDir: string
  outputDir: string
  allowedDomains: string[]
  allowedUrls: string[]
  waitForManifests?: boolean
  printRemovedUrls?: boolean
}): Plugin {
  return {
    name: 'vite-plugin-csp',
    async buildStart() {
      const {
        remixManifestPath,
        clientManifestPath,
        translationDir,
        clientJSDir,
        outputDir,
        allowedDomains,
        allowedUrls,
        waitForManifests = false,
        printRemovedUrls = false
      } = options

      try {
        if (waitForManifests) {
          await Promise.all([
            waitForFile(remixManifestPath),
            waitForFile(clientManifestPath)
          ])
        }

        const remixManifest = await readJsonFile(remixManifestPath)
        const clientManifest = await readJsonFile(clientManifestPath)

        const routeAssets = await mapRoutesToAssets(remixManifest, clientManifest, translationDir, clientJSDir, allowedDomains, allowedUrls)

        const cspHeadersDir = path.join(__dirname, outputDir, 'csp-headers')
        ensureDirectoryExists(cspHeadersDir)

        const allRemovedUrls = new Set<string>()

        for (const [route, { assets, externalUrls, removedUrls }] of Object.entries(routeAssets)) {
          removedUrls.forEach(url => allRemovedUrls.add(url))

          const cspHeader = generateCspHeader(assets, externalUrls)
          const routeFileName = route.replace(/\//g, '__')
          const filteredUrls = Array.from(externalUrls)
          writeJsonFile(path.join(cspHeadersDir, `${routeFileName}.json`), { cspHeader, filteredUrls, removedUrls: Array.from(removedUrls) })
        }

        console.log('CSP headers generated successfully')
        if (printRemovedUrls) {
          console.log('Summary of all unique URLs that were removed:')
          allRemovedUrls.forEach(url => console.log(url))
        }
      } catch (error) {
        console.error(error.message)
      }
    },
    config() {
      // modify Vite config if needed
    },
    configureServer(server) {
      // configure Vite dev server if needed
    },
    transformIndexHtml(html) {
      // transform the index.html if needed
      return html;
    },
    transform(code, id) {
      // transform the code if needed
      return code;
    },
    buildEnd() {
      // hook into the build end
    },
    closeBundle() {
      // hook into the bundle close
    }
  };
}
