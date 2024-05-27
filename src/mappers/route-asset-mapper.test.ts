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
    'route1': { file: 'file1.js', id: 'route1'},
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

    await routeAssetMapper.mapRoutesToAssets('translations')

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

    const routeAssets = await routeAssetMapper.mapRoutesToAssets('translations');

    console.log(routeAssets); // Add this line to log the routeAssets for debugging

    expect(routeAssets).toHaveProperty('route1');
    expect(routeAssets.route1.assets).toContain('file1.js');
    expect(routeAssets.route1.assets).toContain('file2.js');
    expect(routeAssets.route1.externalUrls).toContain('https://external.com/script.js');
  })

  it('should handle missing asset files gracefully', async () => {
    const mockDirectoryExists = directoryExists as MockedFunction<typeof directoryExists>;
    const mockFileExists = fileExists as MockedFunction<typeof fileExists>;

    mockDirectoryExists.mockResolvedValue(false);
    mockFileExists.mockResolvedValue(false);

    const routeAssets = await routeAssetMapper.mapRoutesToAssets('translations')

    expect(routeAssets.route1.assets).toContain('file1.js')
    expect(routeAssets.route1.assets).toContain('file2.js')
    expect(routeAssets.route1.externalUrls.size).toBe(0)
  })

  it('should collect assets for a given route file', () => {
    const assets = new Set<string>()
    routeAssetMapper.collectAssets('file1.js', assets)

    expect(assets).toContain('file1.js')
    expect(assets).toContain('file2.js')
  })

  it('should handle circular dependencies gracefully', () => {
    const circularClientManifest: ClientManifest = {
      'file1.js': { src: 'file1.js', file: 'file1.js', imports: ['file2.js'] },
      'file2.js': { src: 'file2.js', file: 'file2.js', imports: ['file1.js'] }
    }

    routeAssetMapper = new RouteAssetMapper({
      remixManifest: mockRemixManifest,
      clientManifest: circularClientManifest,
      translationDir: 'translations',
      clientJSDir: 'client-js',
      allowedDomains: ['example.com'],
      allowedUrls: ['https://example.com']
    })

    const assets = new Set<string>()
    routeAssetMapper.collectAssets('file1.js', assets)

    expect(assets).toContain('file1.js')
    expect(assets).toContain('file2.js')
  })

  it('should not reprocess already processed files', () => {
    const assets = new Set<string>()
    const processed = new Set<string>()
    processed.add('file2.js')

    routeAssetMapper.collectAssets('file1.js', assets, processed)

    expect(assets).toContain('file1.js')
    expect(assets).not.toConta
    
    it('should collect assets for a given route file', () => {
      const assets = new Set<string>()
      routeAssetMapper.collectAssets('file1.js', assets)
  
      expect(assets).toContain('file1.js')
      expect(assets).toContain('file2.js')
    })
  
    it('should handle circular dependencies gracefully', () => {
      const circularClientManifest: ClientManifest = {
        'file1.js': { src: 'file1.js', file: 'file1.js', imports: ['file2.js'] },
        'file2.js': { src: 'file2.js', file: 'file2.js', imports: ['file1.js'] }
      }
  
      routeAssetMapper = new RouteAssetMapper({
        remixManifest: mockRemixManifest,
        clientManifest: circularClientManifest,
        translationDir: 'translations',
        clientJSDir: 'client-js',
        allowedDomains: ['example.com'],
        allowedUrls: ['https://example.com']
      })
  
      const assets = new Set<string>()
      routeAssetMapper.collectAssets('file1.js', assets)
  
      expect(assets).toContain('file1.js')
      expect(assets).toContain('file2.js')
    })
  
    it('should not reprocess already processed files', () => {
      const assets = new Set<string>()
      const processed = new Set<string>()
      processed.add('file2.js')
  
      routeAssetMapper.collectAssets('file1.js', assets, processed)
  
      expect(assets).toContain('file1.js')
      expect(assets).not.toContain('file2.js')
    })
  
    it('should handle non-existent route files gracefully', () => {
      const assets = new Set<string>()
      routeAssetMapper.collectAssets('non-existent.js', assets)
  
      expect(assets.size).toBe(0)
    })
  
    it('should handle empty imports gracefully', () => {
      const emptyImportsClientManifest: ClientManifest = {
        'file1.js': { src: 'file1.js', file: 'file1.js', imports: [] }
      }
  
      routeAssetMapper = new RouteAssetMapper({
        remixManifest: mockRemixManifest,
        clientManifest: emptyImportsClientManifest,
        translationDir: 'translations',
        clientJSDir: 'client-js',
        allowedDomains: ['example.com'],
        allowedUrls: ['https://example.com']
      })
  
      const assets = new Set<string>()
      routeAssetMapper.collectAssets('file1.js', assets)
  
      expect(assets).toContain('file1.js')
      expect(assets.size).toBe(1)
    })
  })
})