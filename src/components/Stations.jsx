import { motion, useReducedMotion } from 'framer-motion';
import { imageSource } from '../utils/api';
import Icon from './Icon';
export default function Stations({ devices, onOpen, loading, error, refresh, motionEnabled = true }) {
  const reduce = useReducedMotion();
  const enabled = motionEnabled && !reduce;
  return <section className="stations-section">
    <div className="section-title"><div><span className="eyebrow">MONITORING NETWORK</span><h2>Temukan titik pengamatan.</h2></div>
      <span className="station-count">{devices.length} alat terdaftar</span></div>
    {error && <div className="form-alert" role="alert">{error} <button className="text-button" onClick={() => refresh()}>Coba lagi</button></div>}
    {loading && !devices.length && <div className="device-grid">{[0, 1].map(i => <div className="panel station-skeleton" key={i}><div /><span /><span /></div>)}</div>}
    <div className="device-grid">
      {devices.map((device, i) => <motion.article className="panel station-card" key={device.id}
        initial={enabled ? { opacity: 0, y: 18 } : false} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .45, delay: Math.min(i * .08, .4) }} whileHover={enabled ? { y: -5 } : undefined}>
        <button className="station-open" onClick={() => onOpen(device.id)}>
          <div className="station-image"><span className="station-sequence">{String(i + 1).padStart(2, '0')}</span>
            <span className="station-badge"><i /> Terdaftar</span>
            <img src={imageSource(device.image || 'assets/aqms-device.svg')} alt={`Perangkat ${device.name}`} loading="lazy" />
            <span className="station-image-grid" /></div>
          <div className="station-copy"><span className="eyebrow">ENVIRONMENTAL STATION · {device.deviceId}</span><h2>{device.name}</h2>
            <p>Pengukuran lingkungan, tren, dan histori dalam satu tempat.</p>
            <div className="station-card-foot"><span>Buka pemantauan</span><span className="station-arrow"><Icon name="arrow" size={19} /></span></div></div>
        </button>
      </motion.article>)}
    </div>
    {!loading && !error && !devices.length && <div className="panel empty-state"><Icon name="layers" size={36} /><h3>Belum ada alat aktif</h3><p>Daftar alat akan tampil setelah didaftarkan oleh pengelola.</p></div>}
  </section>;
}
