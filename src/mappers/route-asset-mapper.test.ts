/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RouteAssetMapper } from './route-asset-mapper'
import { RemixManifest, ClientManifest } from '../interfaces'
import { directoryExists, fileExists, getAllFiles, readJsonFile } from '../utils/file-utils'
import fs from 'fs/promises'
import path from 'node:path'

// Mock the utility functions
vi.mock('../utils/file-utils', () => ({
  directoryExists: vi.fn(),
  fileExists: vi.fn(),
  getAllFiles: vi.fn(),
  readJsonFile: vi.fn()
}))

vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}))

const mockRemixManifest: RemixManifest = {
  routes: {
    'route1': { file: 'file1.js', id: 'route1' },
    'route2': { file: 'file2.js', id: 'route2' }
  }
}

const mockClientManifest: ClientManifest = {
  'file1.js': { src: 'file1.js', file: 'file1.js', imports: ['file2.js'] },
  'file2.js': { src: 'file2.js', file: 'file2.js', imports: [] }
}

describe('RouteAssetMapper', () => {
  let routeAssetMapper: RouteAssetMapper

  beforeEach(() => {
    routeAssetMapper = new RouteAssetMapper({
      remixManifest: mockRemixManifest,
      clientManifest: mockClientManifest,
      translationDir: 'translations',
      clientJSDir: 'client-js',
      allowedDomains: ['example.com'],
      allowedUrls: ['https://example.com']
    })
  })

  it('should process translation files if directory exists', async () => {
    (directoryExists as vi.Mock).mockResolvedValue(true)
    (getAllFiles as vi.Mock).mockResolvedValue(['translations/file1.json'])
    ;(fs.readFile as vi.Mock).mockResolvedValue('{"url": "https://example.com"}')

    await routeAssetMapper.mapRoutesToAssets()

    expect(directoryExists).toHaveBeenCalledWith('translations')
    expect(getAllFiles).toHaveBeenCalledWith('translations', '.json')
    expect(fs.readFile).toHaveBeenCalledWith('translations/file1.json', 'utf-8')
  })

  it('should map routes to assets correctly', async () => {
    (directoryExists as vi.Mock).mockResolvedValue(false)
    ;(fileExists as vi.Mock).mockResolvedValue(true)
    ;(fs.readFile as vi.Mock).mockResolvedValue('import "https://external.com/script.js"')

    const routeAssets = await routeAssetMapper.mapRoutesToAssets()

    expect(routeAssets).toHaveProperty('route1')
    expect(routeAssets.route1.assets).toContain('file1.js')
    expect(routeAssets.route1.assets).toContain('file2.js')
    expect(routeAssets.route1.externalUrls).toContain('https://external.com/script.js')
  })

  it('should handle missing asset files gracefully', async () => {
    (directoryExists as vi.Mock).mockResolvedValue(false)
    ;(fileExists as vi.Mock).mockResolvedValue(false)

    const routeAssets = await routeAssetMapper.mapRoutesToAssets()

    expect(routeAssets.route1.assets).toContain('file1.js')
    expect(routeAssets.route1.assets).toContain('file2.js')
    expect(routeAssets.route1.externalUrls.size).toBe(0)
  })
});
