import { Plugin } from 'vite'
import path from 'node:path'
import fs from 'fs/promises'

import { readJsonFile, writeJsonFile, ensureDirectoryExists, getAllFiles, waitForFile } from '../utils/file-utils.mts'
import { extractExternalUrls, filterUrls } from './utils/url-utils.mts'
import { generateCspHeader } from './utils/csp-utils.mts'

interface RemixManifest {
  routes: Record<string, { file: string; path?: string; id: string }>
}

interface ClientManifest {
  [key: string]: { src: string; file: string; imports?: string[] }
}

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

      // Your existing buildStart logic here
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
