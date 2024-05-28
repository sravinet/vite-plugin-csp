import { describe, it, expect } from 'vitest';
import { extractExternalUrls, filterUrls } from './url-utils.ts';

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
    it('should filter URLs based on allowed domains and allowed URLs', () => {
        const urls: string[] = [
            'https://example.com/page1', // kept
            'http://another-example.com/page2', // removed
            'https://allowed.com/page3', // kept
            'https://notallowed.com/page4', // removed
            'https://url.com/page5' // kept
        ];
        const allowedDomains: string[] = ['example.com', 'allowed.com'];
        const allowedUrls: string[] = ['https://url.com/page5'];

        const { keptUrls, removedUrls } = filterUrls(urls, allowedDomains, allowedUrls);

        const expectedFilteredUrls: string[] = [
            'https://example.com/page1',
            'https://allowed.com/page3',
            'https://url.com/page5'
        ];
        const expectedRemovedUrls: string[] = [
            'http://another-example.com/page2',
            'https://notallowed.com/page4'
        ];

        expect(keptUrls).toEqual(expectedFilteredUrls);
        expect(removedUrls).toEqual(expectedRemovedUrls);
    });

    it('should remove URLs not in allowed domains or allowed URLs', () => {
        const urls: string[] = [
            'https://example.com/page1',
            'http://another-example.com/page2',
            'https://notallowed.com/page4'
        ];
        const allowedDomains: string[] = ['example.com'];
        const allowedUrls: string[] = [];

        const { keptUrls, removedUrls } = filterUrls(urls, allowedDomains, allowedUrls);

        const expectedFilteredUrls: string[] = ['https://example.com/page1'];
        const expectedRemovedUrls: string[] = [
            'http://another-example.com/page2',
            'https://notallowed.com/page4'
        ];

        expect(keptUrls).toEqual(expectedFilteredUrls);
        expect(removedUrls).toEqual(expectedRemovedUrls);
    });
});
