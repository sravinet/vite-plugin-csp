import { describe, it, expect } from 'vitest';
import { extractExternalUrls, filterUrls } from './url-utils';

describe('extractExternalUrls', () => {
    it('should extract external URLs from file content', () => {
        const fileContent = `
            Here are some URLs:
            https://example.com/page1
            http://another-example.com/page2
            https://example.com/page3
        `;
        const expectedUrls = new Set([
            'https://example.com/page1',
            'http://another-example.com/page2',
            'https://example.com/page3'
        ]);
        const extractedUrls = extractExternalUrls(fileContent);
        expect(extractedUrls).toEqual(expectedUrls);
    });

    it('should return an empty set if no URLs are found', () => {
        const fileContent = 'No URLs here!';
        const extractedUrls = extractExternalUrls(fileContent);
        expect(extractedUrls.size).toBe(0);
    });
});

describe('filterUrls', () => {
    it('should filter URLs based on exempt URLs, allowed domains, and allowed URLs', () => {
        const urls = new Set([
            'https://example.com/page1',
            'http://another-example.com/page2',
            'https://allowed.com/page3',
            'https://notallowed.com/page4'
        ]);
        const exemptUrls = new Set(['https://notallowed.com/page4']);
        const allowedDomains = ['example.com', 'allowed.com'];
        const allowedUrls = ['http://another-example.com/page2'];

        const { filteredUrls, removedUrls } = filterUrls(urls, exemptUrls, allowedDomains, allowedUrls);

        const expectedFilteredUrls = new Set([
            'https://example.com/page1',
            'http://another-example.com/page2',
            'https://allowed.com/page3',
            'https://notallowed.com/page4'
        ]);
        const expectedRemovedUrls = new Set([]);

        expect(filteredUrls).toEqual(expectedFilteredUrls);
        expect(removedUrls).toEqual(expectedRemovedUrls);
    });

    it('should remove URLs not in allowed domains or allowed URLs', () => {
        const urls = new Set([
            'https://example.com/page1',
            'http://another-example.com/page2',
            'https://notallowed.com/page4'
        ]);
        const allowedDomains = ['example.com'];
        const allowedUrls = [];

        const { filteredUrls, removedUrls } = filterUrls(urls, new Set(), allowedDomains, allowedUrls);

        const expectedFilteredUrls = new Set(['https://example.com/page1']);
        const expectedRemovedUrls = new Set([
            'http://another-example.com/page2',
            'https://notallowed.com/page4'
        ]);

        expect(filteredUrls).toEqual(expectedFilteredUrls);
        expect(removedUrls).toEqual(expectedRemovedUrls);
    });
});