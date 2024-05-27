/**
 * Extracts external URLs from the given file content.
 * 
 * @param {string} fileContent - The content of the file to extract URLs from.
 * @returns {Set<string>} - A set of extracted external URLs.
 */
export function extractExternalUrls(fileContent: string): Set<string> {
    const urlPattern = /https?:\/\/[^\s'"]+/g;
    const urls = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = urlPattern.exec(fileContent)) !== null) {
      const url = new URL(match[0]);
      urls.add(`${url.origin}${url.pathname}`);
    }
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
      const domain = new URL(url).hostname;
      if (allowedUrlsSet.has(url) || Array.from(allowedDomainsSet).some(allowedDomain => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))) {
          keptUrls.push(url);
      } else {
          removedUrls.push(url);
      }
  });

  return { keptUrls, removedUrls };
}