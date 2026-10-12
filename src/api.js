// Panel sunucusuyla (main.py) konuşan istemci.
export function normalizeServer(raw) {
  let s = (raw || '').trim().replace(/\/+$/, '');
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  return s;
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function detailText(d, fallback) {
  if (Array.isArray(d)) return d.map((x) => (x.loc || []).slice(1).join('.') + ': ' + x.msg).join('; ');
  if (d && typeof d === 'object') return d.message || fallback;
  return d || fallback;
}

export function makeApi({ server, token, onAuthLost }) {
  return async function api(path, body, method, timeoutMs = 120000) {
    const base = normalizeServer(server);
    if (!base) throw new ApiError('Sunucu adresi girilmedi.');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(base + path, {
        method: method || (body !== undefined ? 'POST' : 'GET'),
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new ApiError(
        e && e.name === 'AbortError'
          ? 'Sunucu zamanında yanıt vermedi.'
          : 'Sunucuya ulaşılamadı. Panel çalışıyor mu, telefon ve bilgisayar aynı Wi-Fi’de mi, adres doğru mu?'
      );
    } finally {
      clearTimeout(timer);
    }
    let data = null;
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      const d = data && data.detail;
      const code = d && typeof d === 'object' && !Array.isArray(d) ? d.code : undefined;
      if (code === 'panel_auth_required' && onAuthLost) onAuthLost();
      throw new ApiError(detailText(d, 'HTTP ' + res.status), res.status, code);
    }
    return data;
  };
}

// Giriş: token alır (30 gün geçerli).
export async function loginForToken(server, username, password) {
  const api = makeApi({ server });
  return api('/api/auth/token', { username, password, remember: true }, 'POST', 20000);
}
