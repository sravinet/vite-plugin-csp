
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
