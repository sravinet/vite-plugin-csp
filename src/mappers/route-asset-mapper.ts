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

  private async processAssets(assets: Set<string>, externalUrls: Set<string>, removedUrls: Set<string>) {
    await Promise.all(Array.from(assets).map(async (asset) => {
      const assetFullPath = path.join(__dirname, 'public', asset)
      if (await fileExists(assetFullPath)) {
        const fileContent = await readJsonFile<string>(assetFullPath)
        const extractedUrls = new Set(extractExternalUrls(fileContent))
        const { keptUrls, removedUrls } = filterUrls(extractedUrls, this.exemptUrls, this.allowedDomains)
        
        keptUrls.forEach(url => externalUrls.add(url))
        removedUrls.forEach(url => removedUrls.add(url))
      }
    }))
  }

  private async processTranslationFiles(dir: string) {
    const files = await getAllFiles(dir, '.json')
    await Promise.all(files.map(async (filePath) => {
      const fileContent = await readJsonFile<string>(filePath)
      extractExternalUrls(fileContent).forEach(url => this.exemptUrls.add(url))
    }))
  }

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
