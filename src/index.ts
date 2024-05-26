import { Plugin } from 'vite'
import path from 'node:path'
import fs from 'fs/promises'
import { readJsonFile, writeJsonFile, ensureDirectoryExists, getAllFiles, waitForFile, directoryExists, fileExists } from './utils/file-utils'
import { extractExternalUrls, filterUrls } from './utils/url-utils'
import { generateCspHeader } from './utils/csp-utils'
import { RemixManifest, ClientManifest, RouteAssets } from './interfaces'

/**
 * Class responsible for mapping routes to their corresponding assets.
 */
class RouteAssetMapper {
  private remixManifest: RemixManifest
  private clientManifest: ClientManifest
  private translationDir: string
  private clientJSDir: string
  private allowedDomains: string[]
  private allowedUrls: string[]
  private exemptUrls: Set<string> = new Set<string>()

  /**
   * Constructor for RouteAssetMapper.
   * @param remixManifest - The Remix manifest.
   * @param clientManifest - The client manifest.
   * @param translationDir - Directory containing translation files.
   * @param clientJSDir - Directory containing client JS files.
   * @param allowedDomains - List of allowed domains.
   * @param allowedUrls - List of allowed URLs.
   */
  constructor(
    remixManifest: RemixManifest,
    clientManifest: ClientManifest,
    translationDir: string,
    clientJSDir: string,
    allowedDomains: string[],
    allowedUrls: string[]
  ) {
    this.remixManifest = remixManifest
    this.clientManifest = clientManifest
    this.translationDir = translationDir
    this.clientJSDir = clientJSDir
    this.allowedDomains = allowedDomains
    this.allowedUrls = allowedUrls
  }

  /**
   * Maps routes to their corresponding assets.
   * @returns A promise that resolves to a record of route assets.
   */
  async mapRoutesToAssets(): Promise<Record<string, RouteAssets>> {
    const routeAssets: Record<string, RouteAssets> = {}

    if (await directoryExists(this.translationDir)) {
      await this.processTranslationFiles(this.translationDir)
    }

    await Promise.all(Object.entries(this.remixManifest.routes).map(async ([routeKey, routeValue]) => {
      const assets = new Set<string>()
      const externalUrls = new Set<string>()
      const removedUrls = new Set<string>()

      this.collectAssets(routeValue.file, assets)

      await Promise.all(Array.from(assets).map(async (asset) => {
        const assetFullPath = path.join(__dirname, 'public', asset)
        if (await fileExists(assetFullPath)) {
          const fileContent = await fs.readFile(assetFullPath, 'utf-8')
          const { filteredUrls, removedUrls: fileRemovedUrls } = filterUrls(new Set(extractExternalUrls(fileContent)), this.exemptUrls, this.allowedDomains, this.allowedUrls)
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
   * Processes translation files to extract exempt URLs.
   * @param dir - Directory containing translation files.
   */
  private async processTranslationFiles(dir: string) {
    const files = await getAllFiles(dir, '.json')
    await Promise.all(files.map(async (filePath) => {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      extractExternalUrls(fileContent).forEach(url => this.exemptUrls.add(url))
    }))
  }

  /**
   * Collects assets for a given route file.
   * @param routeFile - The route file.
   * @param assets - Set to store collected assets.
   */
  private collectAssets(routeFile: string, assets: Set<string>) {
    for (const asset of Object.values(this.clientManifest)) {
      if (asset.src === routeFile || asset.imports?.includes(routeFile)) {
        assets.add(asset.file)
        if (asset.imports) {
          asset.imports.forEach(imported => this.collectAssets(imported, assets))
        }
      }
    }
  }
}

/**
 * Vite plugin for generating Content Security Policy (CSP) headers.
 * @param options - Plugin options.
 * @returns A Vite plugin.
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

      if (waitForManifests) {
        await Promise.all([waitForFile(remixManifestPath), waitForFile(clientManifestPath)])
      }

      const remixManifest = await readJsonFile<RemixManifest>(remixManifestPath)
      const clientManifest = await readJsonFile<ClientManifest>(clientManifestPath)

      const routeAssetMapper = new RouteAssetMapper(
        remixManifest,
        clientManifest,
        translationDir,
        clientJSDir,
        allowedDomains,
        allowedUrls
      )

      const routeAssets = await routeAssetMapper.mapRoutesToAssets()

      if (printRemovedUrls) {
        for (const [route, assets] of Object.entries(routeAssets)) {
          console.log(`Route: ${route}`)
          console.log(`Removed URLs: ${Array.from(assets.removedUrls).join(', ')}`)
        }
      }

      await ensureDirectoryExists(outputDir)
      await writeJsonFile(path.join(outputDir, 'route-assets.json'), routeAssets)

      const allExternalUrls = Array.from(new Set(
        Object.values(routeAssets).flatMap(asset => Array.from(asset.externalUrls))
      ))

      const cspHeader = generateCspHeader(new Set(allExternalUrls), new Set(allowedDomains))
      await writeJsonFile(path.join(outputDir, 'csp-header.json'), { 'Content-Security-Policy': cspHeader })
    }
  }
}
