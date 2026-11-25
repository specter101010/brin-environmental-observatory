import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import ObservatoryVisual from '../components/ObservatoryVisual';
import Icon from '../components/Icon';
export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (auth.user) return <Navigate to="/admin" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await auth.login(username.trim(), password); setPassword(''); navigate('/admin', { replace: true }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <main className="login-page">
    <section className="login-story">
      <Link to="/" className="portal-brand"><span className="brand-tile">B</span><strong>BRIN<small>ENVIRONMENTAL OBSERVATORY</small></strong></Link>
      <motion.div className="login-story-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
        <span className="portal-eyebrow">CONNECTED ENVIRONMENTS</span>
        <h1>Data yang dekat.<br /><em>Wawasan yang luas.</em></h1>
        <p>Satu ruang untuk mengelola perangkat dan memahami perubahan lingkungan.</p>
      </motion.div>
      <ObservatoryVisual dark />
      <div className="login-story-foot"><span>BRIN × Universitas Sriwijaya</span><span>Research. Observe. Understand.</span></div>
    </section>
    <section className="login-form-side">
      <Link to="/" className="login-back">← Kembali ke dashboard</Link>
      <Link to="/" className="portal-brand login-mobile-brand"><span className="brand-tile">B</span><strong>BRIN<small>ENVIRONMENTAL OBSERVATORY</small></strong></Link>
      <motion.div className="login-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .1 }}>
        <span className="login-lock"><Icon name="layers" size={25} /></span>
        <span className="eyebrow">ADMINISTRATOR PORTAL</span>
        <h2>Selamat datang<br />kembali<span>.</span></h2>
        <p>Masuk untuk mengelola alat pemantauan.</p>
        <form onSubmit={submit}>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" autoComplete="username" placeholder="Username admin" value={username}
            onChange={e => setUsername(e.target.value)} required disabled={busy} maxLength={64} />
          <label htmlFor="password">Password</label>
          <div className="password-field"><input id="password" name="password" autoComplete="current-password" placeholder="Masukkan password"
            type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>{show ? 'Sembunyikan' : 'Lihat'}</button></div>
          {error && <div className="form-alert" role="alert">{error}</div>}
          <button className="button login-submit" type="submit" disabled={busy || auth.loading}>{busy ? 'Memverifikasi…' : 'Masuk ke ruang admin'} <Icon name="arrow" size={18} /></button>
        </form>
        <div className="login-assurance"><i /> Akses khusus pengelola perangkat</div>
      </motion.div>
      <span className="login-legal">BRIN Monitoring · Environmental Observatory</span>
    </section>
  </main>;
}
