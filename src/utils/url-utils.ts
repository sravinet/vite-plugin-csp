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
