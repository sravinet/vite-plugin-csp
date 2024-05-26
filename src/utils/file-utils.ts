import fs from 'fs/promises';
import path from 'path';

/**
 * Reads a JSON file and parses its content.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<T>} - A promise that resolves to the parsed JSON content.
 * @throws {Error} - Throws an error if the file is not found.
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/**
 * Writes data to a JSON file.
 * @param {string} filePath - The path to the JSON file.
 * @param {any} data - The data to write to the file.
 * @returns {Promise<void>} - A promise that resolves when the file has been written.
 */
export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData);
}

/**
 * Ensures that a directory exists. If the directory does not exist, it is created.
 * @param {string} dirPath - The path to the directory.
 * @returns {Promise<void>} - A promise that resolves when the directory exists.
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Recursively gets all files with a specific extension in a directory and its subdirectories.
 * @param {string} dir - The directory to search.
 * @param {string} extension - The file extension to search for.
 * @returns {Promise<string[]>} - A promise that resolves to an array of file paths.
 */
export async function getAllFiles(dir: string, extension: string): Promise<string[]> {
  let results: string[] = [];
  const list = await fs.readdir(dir);
  await Promise.all(list.map(async (file) => {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const nestedFiles = await getAllFiles(filePath, extension);
      results = results.concat(nestedFiles);
    } else if (filePath.endsWith(extension)) {
      results.push(filePath);
    }
  }));
  return results;
}

/**
 * Waits for a file to appear within a specified timeout period.
 * @param {string} filePath - The path to the file.
 * @param {number} [timeout=20000] - The timeout period in milliseconds.
 * @param {number} [interval=500] - The interval period in milliseconds.
 * @returns {Promise<void>} - A promise that resolves when the file is found or rejects if the timeout is exceeded.
 */
export async function waitForFile(filePath: string, timeout: number = 20000, interval: number = 500): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const checkFile = async () => {
      try {
        await fs.access(filePath);
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`File ${filePath} not found within timeout`));
        } else {
          setTimeout(checkFile, interval);
        }
      }
    };
    checkFile();
  });
}

export async function directoryExists(dir: string): Promise<boolean> {
  return fs.access(dir).then(() => true).catch(() => false);
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
