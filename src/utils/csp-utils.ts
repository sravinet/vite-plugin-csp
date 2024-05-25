
/**
 * Generates a Content Security Policy (CSP) header string based on provided assets and external URLs.
 * 
 * @param {string[]} assets - List of asset file names.
 * @param {Set<string>} externalUrls - Set of external URLs.
 * @returns {string} - The generated CSP header string.
 */
export function generateCspHeader(assets: string[], externalUrls: Set<string>): string {
  const scriptSrc: string[] = ["'self'"];
  const styleSrc: string[] = ["'self'"];
  const imgSrc: string[] = ["'self'", "data:"];
  const fontSrc: string[] = ["'self'"];
  const connectSrc: string[] = ["'self'"];

  assets.forEach(asset => {
    if (asset.endsWith('.js')) {
      scriptSrc.push(`'nonce-${asset}'`);
    } else if (asset.endsWith('.css')) {
      styleSrc.push(`'nonce-${asset}'`);
    } else if (/\.(png|jpg|gif|svg)$/.test(asset)) {
      imgSrc.push(asset);
    } else if (/\.(woff|woff2|ttf|otf)$/.test(asset)) {
      fontSrc.push(asset);
    }
  });

  externalUrls.forEach(url => {
    if (/\.js$/.test(url)) {
      scriptSrc.push(url);
    } else if (/\.css$/.test(url)) {
      styleSrc.push(url);
    } else if (/\.(png|jpg|gif|svg)$/.test(url)) {
      imgSrc.push(url);
    } else if (/\.(woff|woff2|ttf|otf)$/.test(url)) {
      fontSrc.push(url);
    } else {
      connectSrc.push(url);
    }
  });

  const cspDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': imgSrc,
    'font-src': fontSrc,
    'connect-src': connectSrc,
  };
    
  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/*

Function generateCspHeader(assets: List of Strings, externalUrls: Set of Strings) -> String:
    Initialize scriptSrc as a list containing "'self'"
    Initialize styleSrc as a list containing "'self'"
    Initialize imgSrc as a list containing "'self'" and "data:"
    Initialize fontSrc as a list containing "'self'"
    Initialize connectSrc as a list containing "'self'"

    For each asset in assets:
        If asset ends with '.js':
            Add "'nonce-" + asset + "'" to scriptSrc
        Else if asset ends with '.css':
            Add "'nonce-" + asset + "'" to styleSrc
        Else if asset matches image file extensions (png, jpg, gif, svg):
            Add asset to imgSrc
        Else if asset matches font file extensions (woff, woff2, ttf, otf):
            Add asset to fontSrc

    For each url in externalUrls:
        If url ends with '.js':
            Add url to scriptSrc
        Else if url ends with '.css':
            Add url to styleSrc
        Else if url matches image file extensions (png, jpg, gif, svg):
            Add url to imgSrc
        Else if url matches font file extensions (woff, woff2, ttf, otf):
            Add url to fontSrc
        Else:
            Add url to connectSrc

    Initialize cspDirectives as a dictionary with:
        'default-src' mapped to ["'self'"]
        'script-src' mapped to scriptSrc
        'style-src' mapped to styleSrc
        'img-src' mapped to imgSrc
        'font-src' mapped to fontSrc
        'connect-src' mapped to connectSrc

    Initialize cspHeader as an empty string
    For each key-value pair in cspDirectives:
        Append key + " " + join values with space + "; " to cspHeader

    Return cspHeader

  */
