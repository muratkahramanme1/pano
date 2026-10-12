export const POST_RE = /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/[\w-]+/;
export const USER_RE = /^[A-Za-z0-9._]{1,30}$/;

export const shortLink = (u) => {
  const m = u.match(/\/(p|reel|reels|tv)\/([\w-]+)/);
  return m ? `/${m[1]}/${m[2]}` : u;
};

// Satır, boşluk, virgül ya da noktalı virgülle ayrılmış bağlantılar; tekrarlar atılır.
export function parseLinks(text) {
  const seen = new Set();
  const ok = [];
  const bad = [];
  (text || '')
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      if (!POST_RE.test(s)) {
        bad.push(s);
        return;
      }
      const key = shortLink(s);
      if (seen.has(key)) return;
      seen.add(key);
      ok.push(s);
    });
  return { ok, bad };
}
