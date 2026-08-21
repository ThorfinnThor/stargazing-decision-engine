export function buildStaticAffiliateRedirectHtml(url: string) {
  const serializedUrl = JSON.stringify(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=${url}"><link rel="canonical" href="${url}"><title>Continue</title></head><body><p>Continue to <a rel="sponsored nofollow" href=${serializedUrl}>partner</a>.</p><script>location.replace(${serializedUrl})</script></body></html>\n`;
}
