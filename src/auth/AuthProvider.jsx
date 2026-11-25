import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { apiRequest, sessionKey } from '../utils/api';
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    let token = ''; try { token = sessionStorage.getItem(sessionKey) || ''; } catch { /* optional storage */ }
    return { token, user: null, loading: !!token, error: '' };
  });
  const clear = useCallback(() => {
    try { sessionStorage.removeItem(sessionKey); } catch { /* optional storage */ }
    setSession({ token: '', user: null, loading: false, error: '' });
  }, []);
  useEffect(() => {
    window.addEventListener('brin-session-expired', clear);
    return () => window.removeEventListener('brin-session-expired', clear);
  }, [clear]);
  useEffect(() => {
    if (!session.token || session.user) return;
    const controller = new AbortController();
    apiRequest('/api/auth/me', { token: session.token, signal: controller.signal })
      .then(result => setSession(s => s.token === session.token ? { ...s, user: result.data, loading: false, error: '' } : s))
      .catch(error => {
        if (error.name === 'AbortError') return;
        if (error.status === 401) clear();
        else setSession(s => ({ ...s, loading: false, error: error.message }));
      });
    return () => controller.abort('cleanup');
  }, [session.token, session.user, clear]);
  const login = async (username, password) => {
    const result = await apiRequest('/api/auth/login', { method: 'POST', body: { username, password } });
    const { token, user } = result.data || {};
    if (!token || !user) throw new Error('Respons login tidak lengkap. Pastikan backend upgrade sudah terpasang.');
    try { sessionStorage.setItem(sessionKey, token); } catch { /* memory fallback */ }
    setSession({ token, user, loading: false, error: '' });
  };
  const logout = async () => {
    try { if (session.token) await apiRequest('/api/auth/logout', { method: 'POST', token: session.token, body: {} }); }
    finally { clear(); }
  };
  return <AuthContext.Provider value={{ ...session, login, logout }}>{children}</AuthContext.Provider>;
}
