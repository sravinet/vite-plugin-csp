import path from 'node:path'
import { readJsonFile, writeJsonFile, ensureDirectoryExists, getAllFiles, waitForFile, directoryExists, fileExists } from '../utils/file-utils'
import { extractExternalUrls, filterUrls } from '../utils/url-utils'
import { RemixManifest, ClientManifest, RouteAssets } from '../interfaces'

export class RouteAssetMapper {
  private remixManifest: RemixManifest
  private clientManifest: ClientManifest
  private translationDir: string
  private clientJSDir: string
  private allowedDomains: string[]
  private allowedUrls: string[]
  private exemptUrls: Set<string> = new Set<string>()

  /**
   * @param {Object} params - The parameters for the constructor.
   * @param {RemixManifest} params.remixManifest - The Remix manifest.
   * @param {ClientManifest} params.clientManifest - The client manifest.
   * @param {string} params.translationDir - The directory for translation files.
   * @param {string} params.clientJSDir - The directory for client JS files.
   * @param {string[]} params.allowedDomains - The list of allowed domains.
   * @param {string[]} params.allowedUrls - The list of allowed URLs.
   */
  constructor({
    remixManifest,
    clientManifest,
    translationDir,
    clientJSDir,
    allowedDomains,
    allowedUrls
  }: {
    remixManifest: RemixManifest,
    clientManifest: ClientManifest,
    translationDir: string,
    clientJSDir: string,
    allowedDomains: string[],
    allowedUrls: string[]
  }) {
    this.remixManifest = remixManifest
    this.clientManifest = clientManifest
    this.translationDir = translationDir
    this.clientJSDir = clientJSDir
    this.allowedDomains = allowedDomains
    this.allowedUrls = allowedUrls
  }

  /**
   * Maps routes to their corresponding assets.
   * @returns {Promise<Record<string, RouteAssets>>} - A promise that resolves to a record of route assets.
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
      await this.processAssets(assets, externalUrls, removedUrls)

      routeAssets[routeKey] = {
        assets: Array.from(assets),
        externalUrls,
        removedUrls
      }
    }))

    return routeAssets
  }

  /**
   * Processes the assets to extract and filter URLs.
   * @param {Set<string>} assets - The set of assets.
   * @param {Set<string>} externalUrls - The set of external URLs.
   * @param {Set<string>} removedUrls - The set of removed URLs.
   */
  private async processAssets(assets: Set<string>, externalUrls: Set<string>, removedUrls: Set<string>) {
    await Promise.all(Array.from(assets).map(async (asset) => {
      const assetFullPath = path.join(__dirname, 'public', asset)
      if (await fileExists(assetFullPath)) {
        const fileContent = await readJsonFile<string>(assetFullPath)
        const extractedUrls = Array.from(extractExternalUrls(fileContent))
        const { keptUrls, removedUrls: filteredRemovedUrls } = filterUrls(extractedUrls, this.exemptUrls, this.allowedDomains)
        
        keptUrls.forEach(url => externalUrls.add(url))
        filteredRemovedUrls.forEach(url => removedUrls.add(url))
      }
    }))
  }

  /**
   * Processes translation files to extract exempt URLs.
   * @param {string} dir - The directory containing translation files.
   */
  private async processTranslationFiles(dir: string) {
    const files = await getAllFiles(dir, '.json')
    await Promise.all(files.map(async (filePath) => {
      const fileContent = await readJsonFile<string>(filePath)
      extractExternalUrls(fileContent).forEach(url => this.exemptUrls.add(url))
    }))
  }

  /**
   * Collects assets for a given route file.
   * @param {string} routeFile - The route file.
   * @param {Set<string>} assets - The set of assets.
   * @param {Set<string>} [processed=new Set<string>()] - The set of processed files.
   */
  private collectAssets(routeFile: string, assets: Set<string>, processed: Set<string> = new Set<string>()) {
    if (processed.has(routeFile)) return
    processed.add(routeFile)

    for (const asset of Object.values(this.clientManifest)) {
      if (asset.src === routeFile || asset.imports?.includes(routeFile)) {
        assets.add(asset.file)
        if (asset.imports) {
          asset.imports.forEach(imported => this.collectAssets(imported, assets, processed))
        }
      }
    }
  }
}

export default RouteAssetMapper
