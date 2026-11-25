import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeRecord, timestamp } from '../utils/data';
import { apiRequest } from '../utils/api';
const interval = Math.max(5000, Number(import.meta.env.VITE_POLL_INTERVAL) || 10000);
const batch = Math.min(1000, Math.max(1, Math.floor(Number(import.meta.env.VITE_SENSOR_LIMIT) || 500)));
const maxRows = Math.max(batch, Number(import.meta.env.VITE_HISTORY_MAX_ROWS) || 10000);
const empty = { rows: [], loading: false, loadingMore: false, error: '', fetched: null, total: 0, deviceKey: '' };
function mergeRows(incoming, previous) {
  const merged = new Map();
  [...incoming, ...previous].forEach(row => { if (!merged.has(String(row.id))) merged.set(String(row.id), row); });
  return [...merged.values()].sort((a, b) => timestamp(b.timestamp) - timestamp(a.timestamp)).slice(0, maxRows);
}
export default function useSensorData(paused, device) {
  const deviceId = device?.deviceId || '';
  const deviceKey = device?.id || '';
  const [state, setState] = useState(empty);
  const activeRequest = useRef(null), nextPage = useRef(2), generation = useRef(0);
  const fetchPage = useCallback(async (page, background = false) => {
    if (paused || !deviceId || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const version = generation.current;
    if (!background) setState(s => ({ ...s, [page === 1 ? 'loading' : 'loadingMore']: true }));
    try {
      const result = await apiRequest(`/api/sensor-data?device_id=${encodeURIComponent(deviceId)}&page=${page}&limit=${batch}`, { signal: controller.signal });
      if (!Array.isArray(result.data) || !result.pagination) throw new Error('Respons API harus berisi data dan pagination.');
      const incoming = result.data.filter(r => String(r.device_id) === deviceId).map(normalizeRecord);
      if (version !== generation.current || controller.signal.aborted) return;
      if (page > 1) nextPage.current = page + 1;
      setState(s => ({ ...s, rows: mergeRows(incoming, s.deviceKey === deviceKey ? s.rows : []),
        deviceKey, loading: false, loadingMore: false, error: '', total: Number(result.pagination.total), fetched: new Date() }));
    } catch (error) {
      if (error.name !== 'AbortError' && version === generation.current)
        setState(s => ({ ...s, loading: false, loadingMore: false, error: error.message }));
    } finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }, [paused, deviceId, deviceKey]);
  useEffect(() => {
    const effectGeneration = ++generation.current;
    nextPage.current = 2;
    let cancelled = false, timer;
    const tick = async () => {
      if (!document.hidden) await fetchPage(1, true);
      if (!cancelled) timer = setTimeout(tick, interval);
    };
    timer = setTimeout(() => { setState({ ...empty, loading: !paused && !!deviceId }); void tick(); }, 0);
    const visible = () => { if (!document.hidden) void fetchPage(1, true); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      cancelled = true; generation.current = effectGeneration + 1; clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
      activeRequest.current?.abort('cleanup'); activeRequest.current = null;
    };
  }, [fetchPage, paused, deviceId]);
  const rows = state.deviceKey === deviceKey ? state.rows : [];
  return { ...state, rows, interval, refresh: () => fetchPage(1), loadMore: () => fetchPage(nextPage.current),
    hasMore: rows.length < state.total && rows.length < maxRows, maxRows };
}
