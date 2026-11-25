import { motion, useReducedMotion } from 'framer-motion';
import { asset } from '../utils/api';
import Icon from './Icon';
export default function ObservatoryVisual({ enabled = true, dark = false }) {
  const reduce = useReducedMotion();
  const animate = enabled && !reduce;
  return <div className={`observatory-visual ${dark ? 'observatory-dark' : ''}`} aria-hidden="true">
    <div className="observatory-grid" />
    {[0, 1, 2].map(i => <motion.div className={`observatory-orbit orbit-${i}`} key={i}
      animate={animate ? { rotate: i % 2 ? -360 : 360 } : { rotate: 0 }}
      transition={{ duration: 35 + i * 15, repeat: Infinity, ease: 'linear' }}><i /></motion.div>)}
    <div className="observatory-glow" />
    <motion.img src={asset('assets/aqms-device.svg')} alt=""
      animate={animate ? { y: [0, -10, 0] } : { y: 0 }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.span className="observatory-chip chip-wind" animate={animate ? { y: [0, 7, 0] } : { y: 0 }}
      transition={{ duration: 5, repeat: Infinity }}><Icon name="air" /> Aliran udara</motion.span>
    <motion.span className="observatory-chip chip-temp" animate={animate ? { y: [0, -7, 0] } : { y: 0 }}
      transition={{ duration: 6, repeat: Infinity }}><Icon name="temp" /> Kondisi lingkungan</motion.span>
    <span className="observatory-coordinate">SENSOR NETWORK / ILUSTRASI</span>
  </div>;
}
