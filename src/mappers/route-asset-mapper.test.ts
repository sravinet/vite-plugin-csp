import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest'
import { RouteAssetMapper } from './route-asset-mapper'
import { RemixManifest, ClientManifest } from '../interfaces'
import { directoryExists, fileExists, getAllFiles, readJsonFile } from '../utils/file-utils'

// Mock the utility functions
vi.mock('../utils/file-utils', () => ({
  directoryExists: vi.fn(),
  fileExists: vi.fn(),
  getAllFiles: vi.fn(),
  readJsonFile: vi.fn()
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
    const mockDirectoryExists = directoryExists as MockedFunction<typeof directoryExists>;
    const mockGetAllFiles = getAllFiles as MockedFunction<typeof getAllFiles>;
    const mockReadJsonFile = readJsonFile as MockedFunction<typeof readJsonFile>;

    mockDirectoryExists.mockResolvedValue(true);
    mockGetAllFiles.mockResolvedValue(['translations/file1.json']);
    mockReadJsonFile.mockResolvedValue({ url: 'https://example.com' });

    await routeAssetMapper.mapRoutesToAssets()

    expect(directoryExists).toHaveBeenCalledWith('translations')
    expect(getAllFiles).toHaveBeenCalledWith('translations', '.json')
    expect(readJsonFile).toHaveBeenCalledWith('translations/file1.json')
  })

  it('should map routes to assets correctly', async () => {
    const mockDirectoryExists = directoryExists as MockedFunction<typeof directoryExists>;
    const mockFileExists = fileExists as MockedFunction<typeof fileExists>;
    const mockReadJsonFile = readJsonFile as MockedFunction<typeof readJsonFile>;

    mockDirectoryExists.mockResolvedValue(false);
    mockFileExists.mockResolvedValue(true);
    mockReadJsonFile.mockResolvedValue({ url: 'https://external.com/script.js' });

    const routeAssets = await routeAssetMapper.mapRoutesToAssets()

    expect(routeAssets).toHaveProperty('route1')
    expect(routeAssets.route1.assets).toContain('file1.js')
    expect(routeAssets.route1.assets).toContain('file2.js')
    expect(routeAssets.route1.externalUrls).toContain('https://external.com/script.js')
  })

  it('should handle missing asset files gracefully', async () => {
    const mockDirectoryExists = directoryExists as MockedFunction<typeof directoryExists>;
    const mockFileExists = fileExists as MockedFunction<typeof fileExists>;

    mockDirectoryExists.mockResolvedValue(false);
    mockFileExists.mockResolvedValue(false);

    const routeAssets = await routeAssetMapper.mapRoutesToAssets()

    expect(routeAssets.route1.assets).toContain('file1.js')
    expect(routeAssets.route1.assets).toContain('file2.js')
    expect(routeAssets.route1.externalUrls.size).toBe(0)
  })
})