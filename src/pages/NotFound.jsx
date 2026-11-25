
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="not-found">
      <motion.div
        className="not-found-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="not-found-icon">
          <SearchX size={32} />
        </div>

        <span className="not-found-label">
          PAGE NOT FOUND
        </span>

        <h1>404</h1>

        <h2>Halaman tidak ditemukan</h2>

        <p>
          Maaf, halaman yang Anda cari tidak tersedia,
          telah dipindahkan, atau alamat URL yang
          dimasukkan tidak benar.
        </p>

        <div className="not-found-actions">
          <button
            className="not-found-primary"
            onClick={() => navigate("/aqms_ng")}
          >
            <Home size={17} />
            Kembali ke Beranda
          </button>

          <button
            className="not-found-secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={17} />
            Halaman Sebelumnya
          </button>
        </div>

        <div className="not-found-footer">
          AQMS Monitoring System
        </div>
      </motion.div>
    </main>
  );
}
 