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
 * @param {Set<string>} urls - The set of URLs to filter.
 * @param {Set<string>} [allowedDomains=new Set()] - The set of allowed domains. URLs from these domains are included in the filtered results.
 * @param {Set<string>} [allowedUrls=new Set()] - The set of allowed URLs. These specific URLs are included in the filtered results.
 * @returns {{ filteredUrls: Set<string>, removedUrls: Set<string> }} - An object containing the filtered URLs and removed URLs.
 */
export function filterUrls(urls: Set<string>, allowedDomains: Set<string> = new Set(), allowedUrls: Set<string> = new Set()): { keptUrls: Set<string>, removedUrls: Set<string> } {
  const keptUrls = new Set<string>();
  const removedUrls = new Set<string>();

  urls.forEach(url => {
      const domain = new URL(url).hostname;
      if (allowedUrls.has(url) || Array.from(allowedDomains).some(allowedDomain => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))) {
          keptUrls.add(url);
      } else {
          removedUrls.add(url);
      }
  });

  return { keptUrls, removedUrls };
}