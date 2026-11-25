import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import useDevices from '../components/useDevices';
import { apiRequest } from '../utils/api';
import Icon from '../components/Icon';
const blank = { nama_alat: '', mqtt_topic: '', is_active: true };
export default function Admin() {
  const auth = useAuth();
  if (auth.loading) return <div className="portal-wait"><span className="portal-spinner" /><p>Memverifikasi sesi…</p></div>;
  if (!auth.token) return <Navigate to="/login" replace />;
  if (auth.error) return <div className="portal-wait"><h2>Koneksi belum tersedia</h2><p>{auth.error}</p><button className="button" onClick={() => window.location.reload()}>Coba lagi</button></div>;
  return <AdminWorkspace />;
}
function AdminWorkspace() {
  const auth = useAuth();
  const registry = useDevices(true);
  const [form, setForm] = useState(blank), [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [pending, setPending] = useState(null);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (!form.nama_alat.trim() || !form.mqtt_topic.trim()) throw new Error('Isi nama alat dan topik MQTT.');
      await apiRequest(`/api/admin/devices${editing ? `/${editing}` : ''}`, { method: editing ? 'PATCH' : 'POST', token: auth.token,
        body: { ...form, nama_alat: form.nama_alat.trim(), mqtt_topic: form.mqtt_topic.trim() } });
      setNotice(editing ? 'Perubahan alat tersimpan.' : 'Alat berhasil ditambahkan.');
      setEditing(null); setForm(blank); await registry.refresh();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  async function deactivate() {
    setBusy(true); setError('');
    try {
      await apiRequest(`/api/admin/devices/${pending.deviceId}`, { method: 'DELETE', token: auth.token });
      setPending(null); setNotice('Alat dinonaktifkan. Histori pengukuran tetap tersedia.'); await registry.refresh();
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  }
  return <div className="admin-page">
    <header className="admin-topbar"><Link to="/" className="portal-brand"><span className="brand-tile">B</span><strong>BRIN<small>MONITORING WORKSPACE</small></strong></Link>
      <div className="admin-account"><span>{auth.user?.nama || 'Admin'}</span><button className="button secondary" onClick={() => auth.logout().catch(() => {})}>Keluar</button></div></header>
    <main className="admin-main"><div className="admin-heading"><div><span className="eyebrow">DEVICE MANAGEMENT</span><h1>Ruang pengelola<span>.</span></h1><p>Atur perangkat, sambungkan titik pengamatan baru.</p></div><Link className="button secondary" to="/">Lihat dashboard <Icon name="arrow" size={16} /></Link></div>
      <div className="admin-stats"><div><span>Total perangkat</span><strong>{registry.devices.length.toString().padStart(2, '0')}</strong></div><div><span>Perangkat aktif</span><strong>{registry.devices.filter(d => d.active).length.toString().padStart(2, '0')}</strong></div><div><span>Ruang kerja</span><strong className="admin-stats-label">{auth.user?.username || 'Admin'}</strong></div></div>
      <div className="admin-layout"><section className="panel admin-device-form"><span className="eyebrow">{editing ? 'EDIT DEVICE' : 'NEW DEVICE'}</span><h2>{editing ? 'Perbarui perangkat.' : 'Tambahkan titik baru.'}</h2><p>Nama yang mudah dikenali dan topik khusus untuk setiap alat.</p>
        <form onSubmit={submit}><label>Nama alat<input value={form.nama_alat} maxLength={100} placeholder="Stasiun pemantauan 02" required disabled={busy} onChange={e => setForm({ ...form, nama_alat: e.target.value })} /></label>
          <label>Topik MQTT<input value={form.mqtt_topic} maxLength={255} placeholder="msi/device2" required disabled={busy} onChange={e => setForm({ ...form, mqtt_topic: e.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={form.is_active} disabled={busy} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Perangkat aktif</label>
          {error && <p className="form-alert" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
          <button className="button" disabled={busy}>{busy ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambahkan alat'} <Icon name="arrow" size={16} /></button>
          {editing && <button type="button" className="text-button" disabled={busy} onClick={() => { setEditing(null); setForm(blank); setError(''); }}>Batalkan edit</button>}
        </form><div className="admin-form-note"><Icon name="info" size={18} /><p>ID alat dibuat otomatis. Gunakan ID dari daftar ini saat mengirim data perangkat.</p></div></section>
        <section className="panel admin-device-list"><div className="panel-heading"><div><span className="eyebrow">YOUR NETWORK</span><h2>Daftar perangkat</h2></div><button className="icon-button" aria-label="Perbarui daftar alat" onClick={() => registry.refresh()}><Icon name="refresh" /></button></div>
          {registry.error && <p className="form-alert" role="alert">{registry.error}</p>}
          {registry.loading && <p className="note">Memuat perangkat…</p>}
          <div className="admin-rows">{registry.devices.map(device => <motion.article layout className="admin-device-row" key={device.id}>
            <span className="admin-device-icon"><Icon name="layers" /></span><div className="admin-device-info"><h3>{device.name}</h3><code>{device.topic}</code><small>Device ID · {device.deviceId}</small></div>
            <span className={`device-active-state ${device.active ? 'is-active' : ''}`}><i />{device.active ? 'Aktif' : 'Nonaktif'}</span>
            <div className="admin-row-actions"><button className="button secondary" disabled={busy} onClick={() => { setEditing(device.deviceId); setForm({ nama_alat: device.name, mqtt_topic: device.topic, is_active: device.active }); setError(''); setNotice(''); }}>Edit</button>
              {device.active && <button className="text-button danger-text" disabled={busy} onClick={() => setPending(device)}>Nonaktifkan</button>}</div>
          </motion.article>)}</div>
          {!registry.loading && !registry.error && !registry.devices.length && <div className="empty-state"><h3>Mulai bangun jaringanmu.</h3><p>Tambahkan perangkat pertama melalui formulir.</p></div>}
        </section></div>
      <footer><span>BRIN Monitoring / Ruang pengelola perangkat</span><span>BRIN × Universitas Sriwijaya</span></footer>
    </main>
    <AnimatePresence>{pending && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onKeyDown={event => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); setPending(null); }
      if (event.key === 'Tab') {
        const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      <span className="eyebrow">DEVICE STATUS</span><h2 id="confirm-title">Nonaktifkan {pending.name}?</h2><p>Penerimaan data akan dihentikan. Histori yang sudah tersimpan tetap tersedia.</p>{error && <p className="form-alert" role="alert">{error}</p>}<div><button autoFocus className="button secondary" disabled={busy} onClick={() => setPending(null)}>Batal</button><button className="button" disabled={busy} onClick={deactivate}>{busy ? 'Memproses…' : 'Nonaktifkan alat'}</button></div>
    </motion.section></motion.div>}</AnimatePresence>
  </div>;
}
