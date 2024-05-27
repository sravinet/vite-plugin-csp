import { IsUrl, validateSync } from 'class-validator';

/**
 * Extracts external URLs from the given file content.
 * 
 * @param {string} fileContent - The content of the file to extract URLs from.
 * @returns {Set<string>} - A set of extracted external URLs.
 */

class UrlValidator {
  @IsUrl()
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

export function extractExternalUrls(fileContent: any): Set<string> {
  const urls = new Set<string>();

  if (typeof fileContent !== 'string') {
    fileContent = String(fileContent);
  }

  const words = fileContent.split(/\s+/);

  words.forEach((word: string) => {
    const urlValidator = new UrlValidator(word);
    const errors = validateSync(urlValidator);
    if (errors.length === 0) {
      urls.add(word);
    }
  });

  return urls;
}

/**
 * Filters URLs based on allowed domains and allowed URLs.
 * 
 * @param {string[]} urls - The array of URLs to filter.
 * @param {string[]} [allowedDomains=[]] - The array of allowed domains. URLs from these domains are included in the filtered results.
 * @param {string[]} [allowedUrls=[]] - The array of allowed URLs. These specific URLs are included in the filtered results.
 * @returns {{ keptUrls: string[], removedUrls: string[] }} - An object containing the filtered URLs and removed URLs.
 */
export function filterUrls(urls: string[], allowedDomains: string[] = [], allowedUrls: string[] = []): { keptUrls: string[], removedUrls: string[] } {
  const keptUrls: string[] = [];
  const removedUrls: string[] = [];
  const allowedDomainsSet = new Set(allowedDomains);
  const allowedUrlsSet = new Set(allowedUrls);

  urls.forEach(url => {
    try {
      const domain = new URL(url).hostname;
      if (allowedUrlsSet.has(url) || allowedDomainsSet.has(domain)) {
        keptUrls.push(url);
      } else {
        removedUrls.push(url);
      }
    } catch (e) {
      // Skip invalid URLs
      removedUrls.push(url);
    }
  });

  return { keptUrls, removedUrls };
}
