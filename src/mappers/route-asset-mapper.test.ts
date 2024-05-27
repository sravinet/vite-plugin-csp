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
      allowedUrls: ['https://example.com', 'https://external.com/script.js']
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

  it('should process assets and extract external URLs correctly', async () => {
    const mockFileExists = fileExists as MockedFunction<typeof fileExists>;
    const mockReadJsonFile = readJsonFile as MockedFunction<typeof readJsonFile>;
  
    mockFileExists.mockResolvedValue(true);
    mockReadJsonFile.mockResolvedValue(JSON.stringify({ url: 'https://external.com/script.js' }));
  
    const assets = new Set<string>(['file1.js']);
    const externalUrls = new Set<string>();
    const removedUrls = new Set<string>();
  
    await routeAssetMapper.processAssets(assets, externalUrls, removedUrls);
  
    expect(externalUrls).toContain('https://external.com/script.js');
    expect(removedUrls.size).toBe(0);
  });


  it('should map routes to assets correctly', async () => {
    const mockDirectoryExists = directoryExists as MockedFunction<typeof directoryExists>;
    const mockFileExists = fileExists as MockedFunction<typeof fileExists>;
    const mockReadJsonFile = readJsonFile as MockedFunction<typeof readJsonFile>;
  
    mockDirectoryExists.mockResolvedValue(false);
    mockFileExists.mockImplementation((filePath) => {
      return Promise.resolve(filePath.includes('file1.js') || filePath.includes('file2.js'));
    });
    mockReadJsonFile.mockImplementation((filePath) => {
      if (filePath.includes('file1.js')) {
        return Promise.resolve({ url: 'https://external.com/script.js' });
      }
      return Promise.resolve({});
    });
  
    const routeAssets = await routeAssetMapper.mapRoutesToAssets('translations');
  
    expect(routeAssets).toHaveProperty('route1');
    expect(routeAssets.route1.assets).toContain('file1.js');
    expect(routeAssets.route1.assets).toContain('file2.js');
    expect(routeAssets.route1.externalUrls).toContain('https://external.com/script.js');
  });

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
    routeAssetMapper.collectAssets('file1.js', assets, mockClientManifest)

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
    routeAssetMapper.collectAssets('file1.js', assets, circularClientManifest)

    expect(assets).toContain('file1.js')
    expect(assets).toContain('file2.js')
  })

  it('should not reprocess already processed files', () => {
    const assets = new Set<string>()
    const processed = new Set<string>()
    processed.add('file2.js')

    routeAssetMapper.collectAssets('file1.js', assets, mockClientManifest, processed)

    expect(assets).toContain('file1.js')
    expect(assets).not.toContain('file2.js')
  })

  it('should handle non-existent route files gracefully', () => {
    const assets = new Set<string>()
    routeAssetMapper.collectAssets('non-existent.js', assets, mockClientManifest)

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
    routeAssetMapper.collectAssets('file1.js', assets, emptyImportsClientManifest)

    expect(assets).toContain('file1.js')
    expect(assets.size).toBe(1)
  })
})
