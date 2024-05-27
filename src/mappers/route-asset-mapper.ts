import path from 'node:path'
import { readJsonFile, writeJsonFile, ensureDirectoryExists, getAllFiles, waitForFile, directoryExists, fileExists } from '../utils/file-utils'
import { extractExternalUrls, filterUrls } from '../utils/url-utils'
import { RemixManifest, ClientManifest, RouteAssets, TranslationJson } from '../interfaces'

/**
 * Class representing a mapper for route assets.
 */
export class RouteAssetMapper {
  private remixManifest: RemixManifest
  private clientManifest: ClientManifest
  private translationDir: string
  private clientJSDir: string
  private allowedDomains: string[]
  private allowedUrls: string[]
  private exemptUrls: Set<string> = new Set<string>()

  /**
   * Creates an instance of RouteAssetMapper.
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
   * @param {string} [translationDir=this.translationDir] - The directory for translation files.
   * @returns {Promise<Record<string, RouteAssets>>} - A promise that resolves to a record of route assets.
   */
  async mapRoutesToAssets(translationDir: string = this.translationDir): Promise<Record<string, RouteAssets>> {
    const routeAssets: Record<string, RouteAssets> = {}

    if (await directoryExists(translationDir)) {
      await this.processTranslationFiles(translationDir)
    }

    await Promise.all(Object.entries(this.remixManifest.routes).map(async ([routeKey, routeValue]) => {
      const assets = new Set<string>()
      const externalUrls = new Set<string>()
      const removedUrls = new Set<string>()

      this.collectAssets(routeValue.file, assets, this.clientManifest)
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
   * @param {string} [baseDir=__dirname] - The base directory for constructing file paths.
   */
  public async processAssets(assets: Set<string>, externalUrls: Set<string>, removedUrls: Set<string>, baseDir: string = this.clientJSDir) {    const processedUrls = new Set<string>();

    const processUrls = (urls: string[]) => {
      const { keptUrls, removedUrls: filteredRemovedUrls } = filterUrls(urls, Array.from(this.exemptUrls), this.allowedDomains);
      keptUrls.forEach(url => {
        if (!processedUrls.has(url)) {
          externalUrls.add(url);
          processedUrls.add(url);
        }
      });
      filteredRemovedUrls.forEach(url => {
        if (!processedUrls.has(url)) {
          removedUrls.add(url);
          processedUrls.add(url);
        }
      });
    };

    for (const asset of assets) {
      const assetFullPath = path.join(baseDir, asset);
      try {
        if (await fileExists(assetFullPath)) {
          const fileContent = await readJsonFile<string>(assetFullPath);
          const extractedUrls = Array.from(extractExternalUrls(fileContent));
          processUrls(extractedUrls);
        } else {
          // If the asset file does not exist, check if it's an external URL directly
          const extractedUrls = Array.from(extractExternalUrls(asset));
          processUrls(extractedUrls);
        }
      } catch (error) {
        console.error(`Error processing asset ${asset}:`, error);
      }
    }
  }

  /**
   * Processes translation files to extract exempt URLs.
   * @param {string} dir - The directory containing translation files.
   */
  public async processTranslationFiles(dir: string) {
    const files = await getAllFiles(dir, '.json')
    await Promise.all(files.map(async (filePath) => {
      const fileContent = await readJsonFile<TranslationJson>(filePath)
      extractExternalUrls(JSON.stringify(fileContent)).forEach(url => this.exemptUrls.add(url))
    }))
  }

  /**
   * This method collects all the assets associated with a given route file.
   * It recursively processes the route file and its imports to gather all related assets.
   * 
   * @param {string} routeFile - The route file for which assets need to be collected.
   * @param {Set<string>} assets - A set to store the collected assets.
   * @param {ClientManifest} clientManifest - The client manifest containing asset information.
   * @param {Set<string>} [processed=new Set<string>()] - A set to keep track of already processed files to avoid circular dependencies.
   */
  public collectAssets(routeFile: string, assets: Set<string>, clientManifest: ClientManifest, processed: Set<string> = new Set<string>()) {
    // If the route file has already been processed, return to avoid reprocessing.
    if (processed.has(routeFile)) return;
    
    // Mark the route file as processed.
    processed.add(routeFile);

    // Iterate over all assets in the client manifest.
    for (const asset of Object.values(clientManifest)) {
      // Check if the asset's source matches the route file or if the asset imports the route file.
      if (asset.src === routeFile || asset.imports?.includes(routeFile)) {
        // Add the asset file to the set of collected assets.
        assets.add(asset.file);
        
        // If the asset has imports, recursively collect assets for each imported file.
        if (asset.imports) {
          asset.imports.forEach(importedFile => {
            this.collectAssets(importedFile, assets, clientManifest, processed);
          });
        }
      }
    }
  }
}

export default RouteAssetMapper
