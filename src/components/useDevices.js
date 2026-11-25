import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../auth/AuthContext';
const normalize = d => ({ id: `station-${d.device_id}`, deviceId: String(d.device_id), name: d.nama_alat,
  topic: d.mqtt_topic || '', active: d.is_active === undefined ? true : !!Number(d.is_active), image: d.image_url || '' });
export default function useDevices(admin = false) {
  const { token } = useAuth();
  const [state, setState] = useState({ devices: [], loading: true, error: '' });
  const endpoint = admin ? '/api/admin/devices' : '/api/devices';
  const requestToken = admin ? token : undefined;
  const refresh = useCallback(async (signal) => {
    try {
      const result = await apiRequest(endpoint, { token: requestToken, signal });
      if (!Array.isArray(result.data)) throw new Error('Daftar alat API tidak valid.');
      setState({ devices: result.data.map(normalize), loading: false, error: '' });
    } catch (error) {
      if (error.name !== 'AbortError') setState(s => ({ ...s, loading: false, error: error.message }));
    }
  }, [endpoint, requestToken]);
  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 30000);
    return () => { controller.abort('cleanup'); clearInterval(timer); };
  }, [refresh]);
  return { ...state, refresh };
}
