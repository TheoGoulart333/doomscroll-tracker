function normalizeDomain(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw.length > 2048 || /\s/.test(raw)) return null;
  let host;
  try {
    host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, '').replace(/\.$/, '');
  if (host.length > 253) return null;
  const labels = host.split('.');
  if (!host.includes('.') || labels.some(label => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  if (labels.every(label => /^\d+$/.test(label))) return null;
  return host;
}

function extractDomain(url) {
  try { return normalizeDomain(new URL(url).hostname); }
  catch { return null; }
}

function matchesTrackedDomain(urlOrHost, domains = []) {
  const hostname = extractDomain(urlOrHost) || normalizeDomain(urlOrHost);
  if (!hostname) return null;
  return domains
    .filter(domain => hostname === domain || hostname.endsWith(`.${domain}`))
    .sort((a, b) => b.length - a.length)[0] || null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeDomain, extractDomain, matchesTrackedDomain };
}
