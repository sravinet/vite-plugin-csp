export interface RemixManifest {
  routes: Record<string, { file: string; path?: string; id: string }>
}

export interface ClientManifest {
  [key: string]: { src: string; file: string; imports?: string[] }
}

export interface RouteAssets {
  assets: string[]
  externalUrls: Set<string>
  removedUrls: Set<string>
}

/**
 * Type representing the structure of translation JSON files.
 */
export type TranslationJson = Record<string, string>

