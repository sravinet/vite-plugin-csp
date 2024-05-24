import fs from 'fs/promises';
import path from 'path';

export async function readJsonFile(filePath: string): Promise<any> {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`File not found: ${filePath}`);
  }
}

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonData);
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

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