import { Plugin } from 'vite'
import path from 'node:path'

import { readJsonFile, writeJsonFile, ensureDirectoryExists, waitForFile } from './utils/file-utils.ts'
import { generateCspHeader } from './utils/csp-utils.ts'
import { RemixManifest, ClientManifest } from './interfaces.ts'
import RouteAssetMapper from './mappers/route-asset-mapper.ts'

function parseOptions(options: {
  remixManifestPath: string
  clientManifestPath: string
  translationDir: string
  clientJSDir: string
  outputDir: string
  allowedDomains: string[]
  allowedUrls: string[]
  waitForManifests?: boolean
  printRemovedUrls?: boolean
}) {
  const {
    remixManifestPath,
    clientManifestPath,
    translationDir: transDir,
    clientJSDir: jsDir,
    allowedDomains: domains,
    allowedUrls: urls,
    waitForManifests = false,
    printRemovedUrls = false
  } = options

  return {
    remixManifestPath,
    clientManifestPath,
    transDir,
    jsDir,
    domains,
    urls,
    waitForManifests,
    printRemovedUrls
  }
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
  let remixManifest: RemixManifest
  let clientManifest: ClientManifest
  let translationDir: string
  let clientJSDir: string
  let allowedDomains: string[]
  let allowedUrls: string[]
  let printRemovedUrls: boolean

  return {
    name: 'vite-plugin-csp',
    async buildStart() {
      const {
        remixManifestPath,
        clientManifestPath,
        transDir,
        jsDir,
        domains,
        urls,
        waitForManifests,
        printRemovedUrls
      } = parseOptions(options)

      if (waitForManifests) {
        await Promise.all([waitForFile(remixManifestPath), waitForFile(clientManifestPath)])
      }

      remixManifest = await readJsonFile<RemixManifest>(remixManifestPath)
      clientManifest = await readJsonFile<ClientManifest>(clientManifestPath)
      translationDir = transDir
      clientJSDir = jsDir
      allowedDomains = domains
      allowedUrls = urls
    },
    async generateBundle() {
      const routeAssetMapper = new RouteAssetMapper({
        remixManifest,
        clientManifest,
        translationDir,
        clientJSDir,
        allowedDomains,
        allowedUrls
      })

      const routeAssets = await routeAssetMapper.mapRoutesToAssets()

      if (options.printRemovedUrls) {
        for (const [route, assets] of Object.entries(routeAssets)) {
          console.log(`Route: ${route}`)
          console.log(`Removed URLs: ${Array.from(assets.removedUrls).join(', ')}`)
        }
      }

      await ensureDirectoryExists(options.outputDir)
      await writeJsonFile(path.join(options.outputDir, 'route-assets.json'), routeAssets)

      const allExternalUrls = Array.from(new Set(
        Object.values(routeAssets).flatMap(asset => Array.from(asset.externalUrls))
      ))

      const cspHeader = generateCspHeader(new Set(allExternalUrls), new Set(allowedDomains))
      await writeJsonFile(path.join(options.outputDir, 'csp-header.json'), { 'Content-Security-Policy': cspHeader })
    }
  }
}

