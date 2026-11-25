const env = import.meta.env;
const legacy = env.VITE_API_URL?.replace(/\/api\/sensor-data\/?(?:\?.*)?$/, '');
export const API_BASE_URL = (env.VITE_API_BASE_URL || legacy || 'https://brin-api.unsri-fasilkom.cloud').replace(/\/+$/, '');
export const asset = path => `${import.meta.env.BASE_URL}${path.replace(/^\.?\//, '')}`;
export const imageSource = source => /^(https?:|data:|blob:)/.test(source) ? source : asset(source);
export const sessionKey = `brin-admin:${API_BASE_URL}`;
export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const controller = new AbortController();
  const forward = () => controller.abort(signal?.reason || 'cleanup');
  if (signal?.aborted) forward();
  signal?.addEventListener('abort', forward, { once: true });
  const timeout = setTimeout(() => controller.abort('timeout'), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method, signal: controller.signal,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let payload;
    try { payload = await response.json(); } catch { throw new ApiError('Respons API bukan JSON yang valid.', response.status); }
    if (!response.ok || payload.success === false) {
      if (response.status === 401 && token) window.dispatchEvent(new Event('brin-session-expired'));
      throw new ApiError(payload.message || `Server merespons HTTP ${response.status}.`, response.status);
    }
    return payload;
  } catch (error) {
    if (controller.signal.aborted) {
      if (controller.signal.reason === 'cleanup') throw new DOMException('Dibatalkan', 'AbortError');
      throw new ApiError('Server belum merespons. Coba lagi.', 0);
    }
    if (error instanceof TypeError) throw new ApiError('API belum terhubung. Periksa koneksi dan konfigurasi CORS backend.', 0);
    throw error;
  } finally {
    clearTimeout(timeout); signal?.removeEventListener('abort', forward);
  }
}
