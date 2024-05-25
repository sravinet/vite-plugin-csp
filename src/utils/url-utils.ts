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
 * Filters URLs based on exempt URLs, allowed domains, and allowed URLs.
 * 
 * @param {Set<string>} urls - The set of URLs to filter.
 * @param {Set<string>} [exemptUrls=new Set()] - The set of URLs to exempt from filtering. These URLs are always included in the filtered results.
 * @param {string[]} [allowedDomains=[]] - The list of allowed domains. URLs from these domains are included in the filtered results.
 * @param {string[]} [allowedUrls=[]] - The list of allowed URLs. These specific URLs are included in the filtered results.
 * @returns {{ filteredUrls: Set<string>, removedUrls: Set<string> }} - An object containing the filtered URLs and removed URLs.
 */
export function filterUrls(urls: Set<string>, exemptUrls: Set<string> = new Set(), allowedDomains: string[] = [], allowedUrls: string[] = []): { filteredUrls: Set<string>, removedUrls: Set<string> } {
    const filteredUrls = new Set<string>();
    const removedUrls = new Set<string>();

    urls.forEach(url => {
        const domain = new URL(url).hostname;
        if (exemptUrls.has(url) || allowedUrls.includes(url) || allowedDomains.some(allowedDomain => domain.includes(allowedDomain))) {
        filteredUrls.add(url);
        } else {
        removedUrls.add(url);
        }
    });

    return { filteredUrls, removedUrls };
}
