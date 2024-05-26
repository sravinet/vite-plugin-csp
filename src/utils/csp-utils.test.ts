import { describe, it, expect } from 'vitest';
import { generateCspHeader } from './csp-utils';

describe('generateCspHeader', () => {
  it('should generate a CSP header with default values', () => {
    const assets = new Set<string>();
    const externalUrls = new Set<string>();
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'");
  });

  it('should include asset nonces in the CSP header', () => {
    const assets = new Set<string>(['app.js', 'styles.css']);
    const externalUrls = new Set<string>();
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toContain("script-src 'self' 'nonce-app.js'");
    expect(result).toContain("style-src 'self' 'nonce-styles.css'");
  });

  it('should include external URLs in the CSP header', () => {
    const assets = new Set<string>();
    const externalUrls = new Set<string>(['https://example.com/script.js', 'https://example.com/style.css']);
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toContain("script-src 'self' https://example.com/script.js");
    expect(result).toContain("style-src 'self' https://example.com/style.css");
  });

  it('should include image and font assets in the CSP header', () => {
    const assets = new Set<string>(['image.png', 'font.woff']);
    const externalUrls = new Set<string>();
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toContain("img-src 'self' data: image.png");
    expect(result).toContain("font-src 'self' font.woff");
  });

  it('should include external image and font URLs in the CSP header', () => {
    const assets = new Set<string>();
    const externalUrls = new Set<string>(['https://example.com/image.png', 'https://example.com/font.woff']);
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toContain("img-src 'self' data: https://example.com/image.png");
    expect(result).toContain("font-src 'self' https://example.com/font.woff");
  });

  it('should include connect-src URLs in the CSP header', () => {
    const assets = new Set<string>();
    const externalUrls = new Set<string>(['https://api.example.com']);
    const result = generateCspHeader(assets, externalUrls);
    expect(result).toContain("connect-src 'self' https://api.example.com");
  });
});