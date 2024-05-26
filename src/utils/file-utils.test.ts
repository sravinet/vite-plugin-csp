import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  readJsonFile,
  writeJsonFile,
  ensureDirectoryExists,
  getAllFiles,
  waitForFile,
  directoryExists,
  fileExists
} from './file-utils';

vi.mock('fs/promises');

describe('file-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file', async () => {
      const filePath = 'test.json';
      const fileContent = '{"key": "value"}';
      (fs.access as any).mockResolvedValue(undefined);
      (fs.readFile as any).mockResolvedValue(fileContent);

      const result = await readJsonFile<{ key: string }>(filePath);
      expect(result).toEqual({ key: 'value' });
      expect(fs.access).toHaveBeenCalledWith(filePath);
      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw an error if file is not found', async () => {
      const filePath = 'test.json';
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(readJsonFile(filePath)).rejects.toThrow(`File not found: ${filePath}`);
    });
  });

  describe('writeJsonFile', () => {
    it('should write data to JSON file', async () => {
      const filePath = 'test.json';
      const data = { key: 'value' };
      (fs.writeFile as any).mockResolvedValue(undefined);

      await writeJsonFile(filePath, data);
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify(data, null, 2));
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = 'testDir';
      (fs.access as any).mockRejectedValue(new Error('Directory not found'));
      (fs.mkdir as any).mockResolvedValue(undefined);

      await ensureDirectoryExists(dirPath);
      expect(fs.access).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdir).toHaveBeenCalledWith(dirPath, { recursive: true });
    });

    it('should not create directory if it exists', async () => {
      const dirPath = 'testDir';
      (fs.access as any).mockResolvedValue(undefined);

      await ensureDirectoryExists(dirPath);
      expect(fs.access).toHaveBeenCalledWith(dirPath);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('getAllFiles', () => {
    it('should recursively get all files with specific extension', async () => {
      const dir = 'testDir';
      const extension = '.txt';
      const files = ['file1.txt', 'file2.txt'];
      (fs.readdir as any).mockResolvedValue(files);
      (fs.stat as any).mockResolvedValue({ isDirectory: () => false });

      const result = await getAllFiles(dir, extension);
      expect(result).toEqual(files.map(file => path.join(dir, file)));
    });
  });

  describe('waitForFile', () => {
    it('should resolve when file is found within timeout', async () => {
      const filePath = 'test.txt';
      (fs.access as any).mockResolvedValue(undefined);

      await expect(waitForFile(filePath)).resolves.toBeUndefined();
    });

    it('should reject when file is not found within timeout', async () => {
      const filePath = 'test.txt';
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      await expect(waitForFile(filePath, 1000, 100)).rejects.toThrow(`File ${filePath} not found within timeout`);
    });
  });

  describe('directoryExists', () => {
    it('should return true if directory exists', async () => {
      const dir = 'testDir';
      (fs.access as any).mockResolvedValue(undefined);

      const result = await directoryExists(dir);
      expect(result).toBe(true);
    });

    it('should return false if directory does not exist', async () => {
      const dir = 'testDir';
      (fs.access as any).mockRejectedValue(new Error('Directory not found'));

      const result = await directoryExists(dir);
      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const filePath = 'test.txt';
      (fs.access as any).mockResolvedValue(undefined);

      const result = await fileExists(filePath);
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const filePath = 'test.txt';
      (fs.access as any).mockRejectedValue(new Error('File not found'));

      const result = await fileExists(filePath);
      expect(result).toBe(false);
    });
  });
});

