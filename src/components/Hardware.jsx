import { asset, imageSource } from "../utils/api";
import { useState } from "react";
import Icon from "./Icon";
const wiring = imageSource(import.meta.env.VITE_WIRING_IMAGE || "assets/wiring.jpeg");
export default function Hardware() {
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const blueprint = imageSource(import.meta.env.VITE_BLUEPRINT_IMAGE || "assets/Blueprint.png");
  return (
    <>
      <section className="panel blueprint-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">INSIDE THE OBSERVATORY</span>
            <h2>Setiap komponen, satu sistem.</h2>
          </div>
          {!blueprint && (
            <button
              className="button secondary"
              aria-pressed={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Rapatkan komponen" : "Pisahkan komponen"}
            </button>
          )}
        </div>
        <div className="blueprint-layout">
          <div className={`hardware-visual ${expanded ? "exploded" : ""}`}>
            {blueprint ? (
              <img
                className="custom-blueprint"
                src={blueprint}
                alt="Blueprint komponen alat"
                onError={(e) => {
                  if (e.currentTarget.dataset.fallback) return;
                  e.currentTarget.dataset.fallback = "1";
                  e.currentTarget.src = asset("assets/aqms-blueprint.svg");
                }}
              />
            ) : (
              <>
                <div className="blueprint-axis" />
                <img
                  className="layer layer-cover"
                  src={asset("assets/blueprint-cover.svg")} 
                  alt="Penutup casing konsep"
                />
                <img
                  className="layer layer-sensors"
                  src={asset("assets/blueprint-sensors.svg")} 
                  alt="Papan sensor konsep"
                />
                <img
                  className="layer layer-board"
                  src={asset("assets/blueprint-board.svg")} 
                  alt="Papan kontrol konsep"
                />
                <img
                  className="layer layer-base"
                  src={asset("assets/blueprint-base.svg")} 
                  alt="Dasar casing konsep"
                />
              </>
            )}
            <span className="blueprint-caption">
              EXPLODED VIEW / CONCEPT 01
            </span>
          </div>
          <div className="component-list">
            {[
              {
                n: "01",
                title: "Pelindung perangkat",
                desc: "Casing luar dan ventilasi udara.",
              },
              {
                n: "02",
                title: "Modul sensor",
                desc: "Pengukuran lingkungan, gas, dan partikel.",
              },
              {
                n: "03",
                title: "Unit kontrol",
                desc: "Pemrosesan pembacaan dan komunikasi data.",
              },
              {
                n: "04",
                title: "Daya & koneksi",
                desc: "Distribusi daya dan sambungan komponen.",
              },
            ].map((c) => (
              <div key={c.n}>
                <span>{c.n}</span>
                <section>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </section>
              </div>
            ))}
            <p className="note">
              Ilustrasi susunan komponen, bukan desain perakitan final.
            </p>
          </div>
        </div>
      </section>
      <section className="panel wiring-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CONNECTION MAP</span>
            <h2>Referensi wiring</h2>
          </div>
          <a
            className="button secondary"
            href={wiring}
            target="_blank"
            rel="noreferrer"
          >
            Buka gambar <Icon name="arrow" size={16} />
          </a>
        </div>
        <div className="wiring-layout">
          <div className="wiring-image">
            {failed ? (
              <div className="wiring-fallback">
                <Icon name="info" size={30} />
                <h3>Gambar belum dapat dimuat</h3>
                <p>Gunakan “Buka gambar” untuk melihat sumber referensi.</p>
              </div>
            ) : (
              <img
                src={wiring}
                alt="Dokumentasi wiring perangkat pemantauan"
                loading="lazy"
                decoding="async"
                onError={() => setFailed(true)}
              />
            )}
          </div>
          <div>
            <span className="tag">DOKUMENTASI PERANGKAT</span>
            <h3>
              Alur koneksi
              <br />
              yang lebih mudah dibaca.
            </h3>
            <p>
              Dokumentasi hubungan antarperangkat pada sistem pemantauan lingkungan.
            </p>
            <p className="note">
              Gunakan skema final dan spesifikasi tiap komponen sebagai acuan
              perakitan.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
