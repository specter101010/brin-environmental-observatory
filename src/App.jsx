import { useEffect, useMemo, useState } from "react";

import { flushSync } from "react-dom";

import Icon from "./components/Icon";

import Stations from "./components/Stations";

import useDevices from "./components/useDevices";

import ObservatoryVisual from "./components/ObservatoryVisual";

import Login from "./pages/Login";

import Admin from "./pages/Admin";

import AuthProvider from "./auth/AuthProvider";

import { useAuth } from "./auth/AuthContext";

import { asset } from "./utils/api";

import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { motion, MotionConfig, useReducedMotion } from "framer-motion";

import Device from "./components/Device";

import AirVisual from "./components/AirVisual";

import Hardware from "./components/Hardware";

import useMotion from "./components/useMotion";

import Trend from "./components/Trend";

import useSensorData from "./components/useSensorData";

import NotFound from "./pages/NotFound";

import team from "./data/team.json";

import {

  metrics,

  fmt,

  number,

  dateText,

  dayKey,

  timestamp,

  average,

  airCondition,

  vocMode,

  demoRows,

  exportCSV,

} from "./utils/data";

const navigation = [

  { id: "devices", label: "Dashboard", icon: "grid" },

  { id: "analysis", label: "Analisis", icon: "chart" },

  { id: "history", label: "Histori", icon: "table" },

  { id: "hardware", label: "Perangkat", icon: "layers" },

  { id: "about", label: "Tentang", icon: "info" },

  { id: "team", label: "Tim", icon: "users" },

];

const pageInfo = {

  devices: {

    label: "Dashboard",

    description: "Pilih alat untuk melihat pengukuran, grafik, dan histori.",

  },

  overview: {

    label: "Ringkasan alat",

    description: "Kenali kondisi sekitar dan pantau perubahan setiap saat.",

  },

  analysis: {

    label: "Analisis",

    description: "Amati perubahan parameter dan statistik pengukuran.",

  },

  history: {

    label: "Histori",

    description: "Telusuri dan unduh rekaman pengukuran sensor.",

  },

  hardware: {

    label: "Perangkat",

    description: "Jelajahi rancangan alat, komponen, dan koneksinya.",

  },

  about: {

    label: "Tentang",

    description: "Sistem pemantauan lingkungan berbasis sensor dan IoT.",

  },

  team: {

    label: "Tim riset",

    description: "Kolaborasi di balik pengembangan sistem monitoring.",

  },

};

function Dashboard() {

  const [page, setPage] = useState(() =>

    pageInfo[window.location.hash.slice(1)]

      ? window.location.hash.slice(1)

      : "devices"

  );

  const registry = useDevices();

  const { devices } = registry;

  const auth = useAuth();

  const reduced = useReducedMotion();

  const [deviceKey, setDeviceKey] = useState("station-1");

  const activeDevice = devices.find((d) => d.id === deviceKey) || devices[0];

  const station = activeDevice?.name || "Pilih alat";

  function openDevice(id) {

    setDeviceKey(id);

    setTablePage(1);

    setFrom("");

    setTo("");

    setDemo(false);

    navigate("overview");

  }

  const [demo, setDemo] = useState(false);

  const [sample, setSample] = useState([]);

  const [selected, setSelected] = useState("voc_value");

  const [motionEnabled, setMotionEnabled] = useState(true);

  const [demoQuality, setDemoQuality] = useState("Baik");

  const [range, setRange] = useState("24");

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [tablePage, setTablePage] = useState(1);

  const [exporting, setExporting] = useState(false);

  const [exportError, setExportError] = useState("");

  const live = useSensorData(

    demo || ["devices", "control", "about", "team"].includes(page),

    activeDevice

  );

  const rows = demo ? sample : live.rows;

  const latest = rows[0];

  const air = airCondition(

    demo

      ? { ...latest, iaq_category: demoQuality }

      : stalePlaceholder(latest, live)

      ? null

      : latest

  );

  function stalePlaceholder(row, source) {

    return (

      source.error ||

      !row ||

      !Number.isFinite(timestamp(row.timestamp)) ||

      (source.fetched?.getTime() || 0) - timestamp(row.timestamp) >

        (Number(import.meta.env.VITE_STALE_MINUTES) || 5) * 60000

    );

  }

  useMotion(page + air.tone, motionEnabled);

  const [printing, setPrinting] = useState(false);

  useEffect(() => {

    const before = () => flushSync(() => setPrinting(true));

    const after = () => setPrinting(false);

    window.addEventListener("beforeprint", before);

    window.addEventListener("afterprint", after);

    return () => {

      window.removeEventListener("beforeprint", before);

      window.removeEventListener("afterprint", after);

    };

  }, []);

  const vocMetric = metrics.find((m) => m.key === "voc_value");

  const metric = metrics.find((m) => m.key === selected);

  const stale =

    latest &&

    (!Number.isFinite(timestamp(latest.timestamp)) ||

      (live.fetched?.getTime() || 0) - timestamp(latest.timestamp) >

        (Number(import.meta.env.VITE_STALE_MINUTES) || 5) * 60000);

  const status = demo

    ? "Mode demo"

    : live.error

    ? "Terputus"

    : !latest

    ? live.loading

      ? "Menghubungkan"

      : "Belum ada data"

    : stale

    ? "Data belum mutakhir"

    : "Terhubung";

  const statusType = demo

    ? "demo"

    : live.error

    ? "error"

    : stale || !latest

    ? "muted"

    : "online";

  const chartRows = useMemo(() => {

    if (range === "all") return rows;

    const newest = timestamp(rows[0]?.timestamp);

    return rows.filter(

      (r) => timestamp(r.timestamp) >= newest - Number(range) * 3600000

    );

  }, [rows, range]);

  const filtered = useMemo(

    () =>

      rows.filter(

        (r) =>

          (!from || dayKey(r.timestamp) >= from) &&

          (!to || dayKey(r.timestamp) <= to)

      ),

    [rows, from, to]

  );

  const pages = Math.max(1, Math.ceil(filtered.length / 12));

  const safePage = Math.min(tablePage, pages);

  const values = useMemo(

    () => chartRows.map((r) => number(r[selected])).filter((v) => v !== null),

    [chartRows, selected]

  );

  const lat = number(latest?.latitude),

    lng = number(latest?.longitude);

  const hasCoords =

    lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  function navigate(id) {

    setPage(id);

    window.history.replaceState(

      null,

      "",

      `${window.location.pathname}${window.location.search}#${id}`

    );

    window.scrollTo({ top: 0, behavior: "instant" });

  }

  function toggleDemo() {

    if (!demo) setSample(demoRows());

    setDemo(!demo);

    setTablePage(1);

  }

  async function excel() {

    setExportError("");

    setExporting(true);

    try {

      const XLSX = await import("xlsx");

      const book = XLSX.utils.book_new();

      const sheet = XLSX.utils.json_to_sheet(

        filtered.map((r) => ({

          ID: r.id,

          Waktu: dateText(r.timestamp),

          ...Object.fromEntries(

            metrics.map((m) => [`${m.label} (${m.unit})`, number(r[m.key])])

          ),

          Latitude: number(r.latitude),

          Longitude: number(r.longitude),

        }))

      );

      XLSX.utils.book_append_sheet(book, sheet, demo ? "Demo" : "Data sensor");

      XLSX.writeFile(book, demo ? "brin-demo.xlsx" : "brin-monitoring.xlsx");

    } catch {

      setExportError("Ekspor Excel gagal. Coba unduh CSV.");

    } finally {

      setExporting(false);

    }

  }

  const tabControls = (

    <div className="metric-tabs" role="group" aria-label="Parameter grafik">

      {metrics.map((m) => (

        <button

          key={m.key}

          className={selected === m.key ? "active" : ""}

          onClick={() => setSelected(m.key)}

          aria-pressed={selected === m.key}

        >

          {m.short}

        </button>

      ))}

    </div>

  );

  const graph = (

    <section className="panel graph-panel">

      <div className="panel-heading">

        <div>

          <span className="eyebrow">TREN PEMANTAUAN</span>

          <h2>

            {metric.label} <span className="subtle">/ {metric.unit}</span>

          </h2>

        </div>

        <label className="select-label">

          <span className="sr-only">Rentang grafik</span>

          <select value={range} onChange={(e) => setRange(e.target.value)}>

            <option value="1">1 jam terakhir</option>

            <option value="6">6 jam terakhir</option>

            <option value="24">24 jam terakhir</option>

            <option value="all">Semua data dimuat</option>

          </select>

        </label>

      </div>

      {tabControls}

      <Trend rows={chartRows} metric={metric} />

      <div className="chart-footer">

        <span>

          <i className="legend-dot" />

          {demo ? "Data simulasi" : "Data sensor"} ·{" "}

          {Math.min(chartRows.length, 60)} titik terakhir

        </span>

        <span>Waktu Indonesia Barat</span>

      </div>

    </section>

  );

  return (

    <div className={`app-shell tone-${air.tone}`}>

      <a className="skip-link" href="#main">

        Lewati navigasi

      </a>

      <aside className="sidebar">

        {/* <a

          href="#devices"

          className="brand-mark"

          aria-label="BRIN Monitoring"

          onClick={(e) => {

            e.preventDefault();

            navigate("devices");

          }}

        >

          <span />

          <span />

          <span />

          <span />

        </a> */}

        <img src="assets/brin-titile-logo.png" width="40px" alt="" />

        <nav aria-label="Navigasi utama">

          {navigation.map((n) => {

            const active =

              page === n.id || (page === "overview" && n.id === "devices");

            return (

              <motion.button

                key={n.id}

                onClick={() => navigate(n.id)}

                title={n.label}

                aria-label={n.label}

                aria-current={active ? "page" : undefined}

                className={active ? "nav-item active" : "nav-item"}

                whileHover={

                  motionEnabled && !reduced ? { scale: 1.08, x: 2 } : undefined

                }

                whileTap={

                  motionEnabled && !reduced ? { scale: 0.94 } : undefined

                }

                transition={{ type: "spring", stiffness: 420, damping: 24 }}

              >

                <Icon name={n.icon} />

                <span>{n.label}</span>

              </motion.button>

            );

          })}

        </nav>

        <span className="sidebar-foot">

          {/* <img src="assets/brin-titile-logo.png" width="40px" alt="" /> */}

        </span>

      </aside>

      <div className="workspace">

        <header className="topbar">

          <div className="wordmark">

            <img src="assets/logo-brin.png" width="50px" alt="logo brin" />

            <span className="wordmark-divider" />{" "}

            <span>

              Monitoring<small>ENVIRONMENTAL OBSERVATORY</small>

            </span>

          </div>

          <div className="topbar-tools">

            <span className="institution">Air Quality Monitoring Sytem</span>

            {/* <button

              className="icon-button motion-toggle"

              onClick={() => setMotionEnabled(!motionEnabled)}

              aria-pressed={motionEnabled}

              aria-label={motionEnabled ? "Jeda animasi" : "Aktifkan animasi"}

              title={motionEnabled ? "Jeda animasi" : "Aktifkan animasi"}

            >

              <Icon name={motionEnabled ? "pause" : "play"} />

            </button> */}

            {auth.user && (

              <Link to="/admin" className="button secondary admin-shortcut">

                Ruang admin

              </Link>

            )}

            {/* <span className="avatar" aria-label="BRIN Monitoring">BM</span> */}

            <img src="assets/logo-unsri.png" width="50px" alt="logo unsri" />

          </div>

        </header>

        <motion.main

          id="main"

          key={page}

          initial={motionEnabled && !reduced ? { opacity: 0.5, y: 10 } : false}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.4 }}

        >

          {page === "devices" && (

            <section className="network-hero panel">

              <div className="network-copy">

                <span className="eyebrow">ENVIRONMENTAL OBSERVATORY</span>

                <h2>

                  Lingkungan berubah.

                  <br />

                  <em>Kita mengamatinya.</em>

                </h2>

                <p>

                  Jelajahi setiap titik pengamatan. Temukan cerita di balik data

                  lingkungan, dari pembacaan pertama hingga perubahan

                  berikutnya.

                </p>

                <div className="network-facts">

                  <span>

                    <strong>08</strong>Parameter lingkungan

                  </span>

                  <span>

                    <strong>{String(devices.length).padStart(2, "0")}</strong>

                    Alat terdaftar

                  </span>

                  <span className="network-fact-text">

                    Observe.

                    <br />

                    Understand.

                  </span>

                </div>

              </div>

              <ObservatoryVisual enabled={motionEnabled} />

            </section>

          )}

     {["overview", "analysis", "history"].includes(page) && (

  <motion.div

    className="device-context"

    initial={

      motionEnabled && !reduced

        ? { opacity: 0, y: -8 }

        : false

    }

    animate={{ opacity: 1, y: 0 }}

    transition={{ duration: 0.28 }}

  >

    <motion.button

      type="button"

      className="device-back"

      onClick={() => navigate("devices")}

      whileHover={

        motionEnabled && !reduced

          ? { x: -2 }

          : undefined

      }

      whileTap={

        motionEnabled && !reduced

          ? { scale: 0.96 }

          : undefined

      }

      aria-label="Kembali ke semua alat"

    >

      <span className="device-back-icon">

        <Icon name="arrow" size={16} />

      </span>

      <span>Semua alat</span>

    </motion.button>

    <span

      className="device-context-divider"

      aria-hidden="true"

    />

    <label className="device-picker">

      <i

        className={`device-live-dot ${statusType}`}

        aria-hidden="true"

      />

      <span className="device-picker-field">

        <small>ALAT AKTIF</small>

        <select

          value={activeDevice?.id || ""}

          onChange={(event) =>

            openDevice(event.target.value)

          }

          aria-label="Pilih alat aktif"

        >

          <option value="" disabled>

            Pilih alat

          </option>

          {devices.map((device) => (

            <option

              key={device.id}

              value={device.id}

            >

              {device.name}

            </option>

          ))}

        </select>

      </span>

      <span

        className="device-picker-chevron"

        aria-hidden="true"

      >

        ⌄

      </span>

    </label>

    {/* {activeDevice?.deviceId && (

      <span className="device-id-badge">

        ID {activeDevice.deviceId}

      </span>

    )} */}

  </motion.div>

)}

          <div className="page-heading">

            <div>

              <span className="eyebrow">

                {page === "overview"

                  ? "LINGKUNGAN DALAM DATA"

                  : "BRIN MONITORING"}

              </span>

              <h1>

                {pageInfo[page].label}

                {page === "overview" && <span className="heading-dot">.</span>}

              </h1>

              <p>{pageInfo[page].description}</p>

            </div>

            <div

              className="heading-actions"

              hidden={page === "devices" || page === "control"}

            >

              {/* <button

                className={`button ${demo ? "demo-button" : "secondary"}`}

                onClick={toggleDemo}

                aria-pressed={demo}

              >

                {demo ? "Keluar mode demo" : "Coba demo"}

              </button> */}

              <button

                className="icon-button"

                aria-label="Perbarui data"

                title="Perbarui data"

                disabled={!demo && live.loading}

                onClick={() => (demo ? setSample(demoRows()) : live.refresh())}

              >

                <Icon

                  name="refresh"

                  className={!demo && live.loading ? "spin" : ""}

                />

              </button>

            </div>

          </div>

          <div

            className={`connection-bar ${statusType}`}

            role="status"

            hidden={page === "devices" || page === "control"}

          >

            <span>

              <i className="status-dot" />

              {status}

            </span>

            <span>

              {demo

                ? "Data simulasi untuk pratinjau, bukan hasil pengukuran."

                : live.error ||

                  `Pembaruan otomatis ${live.interval / 1000} detik · ${

                    live.fetched

                      ? "Sinkronisasi " +

                        live.fetched.toLocaleTimeString("id-ID", {

                          timeZone: "Asia/Jakarta",

                        }) +

                        " WIB"

                      : "Menunggu respons server"

                  }`}

            </span>

          </div>

          {page === "devices" && (

            <Stations

              devices={devices}

              onOpen={openDevice}

              loading={registry.loading}

              error={registry.error}

              refresh={registry.refresh}

              motionEnabled={motionEnabled}

            />

          )}

          {page === "overview" && (

            <>

              <div className="overview-grid">

                <section className="hero panel">

                  <AirVisual tone={air.tone} wind={latest?.wind_speed_ms} />

                  <div className="hero-copy">

                    <span className="tag">

                      <i />

                      {station}

                    </span>

                    <h2>

                      Udara bergerak.

                      <br />

                      <em>Data bercerita.</em>

                    </h2>

                    <p>

                      Pantau setiap perubahan lingkungan. Dari udara di sekitar,

                      menjadi wawasan yang berarti.

                    </p>

                    <button

                      className="hero-cta"

                      onClick={() => navigate("analysis")}

                    >

                      Eksplorasi data{" "}

                      <span>

                        <Icon name="arrow" size={18} />

                      </span>

                    </button>

                    <div className="hero-bottom">

                      <span className="hero-count">08</span>

                      <div>

                        <strong>Parameter lingkungan</strong>

                        <small>Satu sistem pemantauan terintegrasi</small>

                      </div>

                    </div>

                  </div>

                  <Device

                    key={activeDevice?.id + (activeDevice?.image || "")}

                    image={activeDevice?.image}

                    deviceId={activeDevice?.deviceId}

                  />

                </section>

                <aside className={`panel air-quality-card quality-${air.tone}`}>

                  <div className="quality-heading">

                    <span>

                      <i /> AIR QUALITY

                    </span>

                    <Icon name="air" size={23} />

                  </div>

                  <div className="quality-orb">

                    <AirVisual

                      tone={air.tone}

                      wind={latest?.wind_speed_ms}

                      compact

                    />

                    <div className="orb-ring" />

                    <div className="orb-ring ring-inner" />

                    <Icon name="air" size={55} />

                  </div>

                  <div className="quality-caption">

                    <span className="quality-label">{air.label}</span>

                    <p>{demo ? "Pratinjau kategori udara" : air.detail}</p>

                  </div>

                  <div className="voc-reading">

                    <div>

                      <span>

                        {vocMode === "tvoc" ? "TOTAL VOC" : "RESPONS GAS / VOC"}

                      </span>

                      <strong>

                        {fmt(latest?.voc_value)}

                        <small>{vocMetric.unit}</small>

                      </strong>

                    </div>

                    <span className="voc-note">

                      {vocMode === "tvoc"

                        ? "Konsentrasi TVOC"

                        : "Resistansi gas"}

                    </span>

                  </div>

                  {demo && (

                    <div

                      className="quality-demo"

                      role="group"

                      aria-label="Simulasi kualitas udara"

                    >

                      {["Baik", "Sedang", "Buruk"].map((q) => (

                        <button

                          key={q}

                          aria-pressed={demoQuality === q}

                          className={demoQuality === q ? "active" : ""}

                          onClick={() => setDemoQuality(q)}

                        >

                          {q}

                        </button>

                      ))}

                    </div>

                  )}

                </aside>

              </div>

              <div className="section-title">

                <div>

                  <span className="eyebrow">LIVE ENVIRONMENT</span>

                  <h2>Setiap detail, terpantau.</h2>

                </div>

                <span className="subtle">

                  {demo ? "DATA SIMULASI" : "PEMBACAAN TERAKHIR"}

                </span>

              </div>

              <div className="sensor-grid">

                {metrics.map((m, i) => (

                  <button

                    className={`panel sensor-card sensor-${m.key}`}

                    key={m.key}

                    onClick={() => {

                      setSelected(m.key);

                      navigate("analysis");

                    }}

                    aria-label={`Analisis ${m.label}`}

                  >

                    <div className="sensor-top">

                      <span className="round-icon" style={{ color: m.color }}>

                        <Icon name={m.icon} />

                      </span>

                      <span className="sensor-code">

                        {String(i + 1).padStart(2, "0")} / {m.short}

                      </span>

                    </div>

                    <span className="sensor-name">{m.label}</span>

                    <div className="sensor-value">

                      {fmt(

                        latest?.[m.key],

                        m.key === "nh3_ppm" || m.key === "co_ppm" ? 2 : 1

                      )}

                      <small>{m.unit}</small>

                    </div>

                    <div className="sensor-foot">

                      <span>

                        {m.key === "voc_value"

                          ? vocMode === "tvoc"

                            ? "Konsentrasi TVOC"

                            : "Resistansi gas"

                          : number(latest?.[m.key]) === null

                          ? "Menunggu data"

                          : "Pengukuran terbaru"}

                      </span>

                      <Icon name="arrow" size={15} />

                    </div>

                  </button>

                ))}

              </div>

              <div className="bottom-grid">

                {graph}

                <motion.section

  className="panel"

  style={{

    padding: "18px",

    overflow: "hidden",

    border: "1px solid #dce6f2",

    borderRadius: "20px",

    background: "#ffffff",

    boxShadow: "0 8px 30px rgba(40, 89, 147, 0.07)",

  }}

  whileHover={

    motionEnabled && !reduced

      ? {

          y: -4,

          borderColor: "#bfd3f0",

          boxShadow: "0 18px 45px rgba(40, 89, 147, 0.13)",

        }

      : undefined

  }

  transition={{

    type: "spring",

    stiffness: 320,

    damping: 24,

  }}

>

  {/* Header */}

  <div

    style={{

      display: "flex",

      alignItems: "flex-start",

      justifyContent: "space-between",

      gap: "14px",

      marginBottom: "16px",

    }}

  >

    <div>

      <span

        style={{

          display: "block",

          color: "#7694b8",

          fontSize: "8px",

          fontWeight: 750,

          letterSpacing: "0.14em",

        }}

      >

        STASIUN PEMANTAUAN

      </span>

      <h3

        style={{

          margin: "8px 0 0",

          color: "#244566",

          fontSize: "16px",

          fontWeight: 650,

          letterSpacing: "-0.4px",

        }}

      >

        {station}

      </h3>

    </div>

    <span

      style={{

        padding: "7px 9px",

        borderRadius: "9px",

        background: "#edf4ff",

        color: "#4f7eb9",

        fontSize: "8px",

        fontWeight: 750,

        letterSpacing: "0.08em",

        whiteSpace: "nowrap",

      }}

    >

      AQMS / {activeDevice?.deviceId || "—"}

    </span>

  </div>

  {/* Visual lokasi */}

  <div

    style={{

      position: "relative",

      minHeight: "180px",

      overflow: "hidden",

      border: "1px solid #dce8f6",

      borderRadius: "16px",

      backgroundColor: "#f6f9fe",

      backgroundImage: `

        linear-gradient(rgba(189, 209, 238, 0.28) 1px, transparent 1px),

        linear-gradient(90deg, rgba(189, 209, 238, 0.28) 1px, transparent 1px),

        radial-gradient(circle at center, #dcecff 0%, transparent 58%)

      `,

      backgroundSize: "25px 25px, 25px 25px, 100% 100%",

    }}

  >

    {/* Lingkaran luar */}

    <motion.div

      style={{

        position: "absolute",

        top: "50%",

        left: "50%",

        width: "155px",

        height: "155px",

        border: "1px dashed rgba(83, 135, 205, 0.28)",

        borderRadius: "50%",

        transform: "translate(-50%, -50%)",

      }}

      animate={

        motionEnabled && !reduced

          ? { rotate: 360 }

          : undefined

      }

      transition={{

        duration: 18,

        repeat: Infinity,

        ease: "linear",

      }}

    />

    {/* Lingkaran dalam */}

    <div

      style={{

        position: "absolute",

        top: "50%",

        left: "50%",

        width: "105px",

        height: "105px",

        border: "1px solid rgba(83, 135, 205, 0.3)",

        borderRadius: "50%",

        transform: "translate(-50%, -50%)",

      }}

    />

    {/* Pin lokasi */}

    <motion.div

      style={{

        position: "absolute",

        zIndex: 2,

        top: "50%",

        left: "50%",

        display: "grid",

        placeItems: "center",

        width: "48px",

        height: "48px",

        border: "1px solid #c5d9f5",

        borderRadius: "15px",

        background: "rgba(255, 255, 255, 0.94)",

        color: "#3173df",

        boxShadow: "0 12px 30px rgba(40, 99, 168, 0.16)",

        translateX: "-50%",

        translateY: "-60%",

      }}

      animate={

        motionEnabled && !reduced

          ? { y: [0, -5, 0] }

          : undefined

      }

      transition={{

        duration: 2.4,

        repeat: Infinity,

        ease: "easeInOut",

      }}

    >

      <motion.span

        style={{

          position: "absolute",

          inset: "-8px",

          border: "1px solid rgba(52, 121, 229, 0.28)",

          borderRadius: "19px",

        }}

        animate={

          motionEnabled && !reduced

            ? {

                opacity: [0.65, 0],

                scale: [0.85, 1.25],

              }

            : undefined

        }

        transition={{

          duration: 2,

          repeat: Infinity,

          ease: "easeOut",

        }}

      />

      <Icon name="pin" size={27} />

    </motion.div>

    {/* Koordinat */}

    <span

      style={{

        position: "absolute",

        zIndex: 2,

        bottom: "12px",

        left: "50%",

        maxWidth: "calc(100% - 24px)",

        overflow: "hidden",

        padding: "7px 10px",

        border: "1px solid #dce7f5",

        borderRadius: "999px",

        background: "rgba(255, 255, 255, 0.88)",

        color: "#7891ae",

        fontSize: "8px",

        textOverflow: "ellipsis",

        whiteSpace: "nowrap",

        transform: "translateX(-50%)",

        backdropFilter: "blur(8px)",

      }}

    >

      {hasCoords

        ? `${fmt(lat, 5)}, ${fmt(lng, 5)}`

        : "Koordinat belum tersedia"}

    </span>

  </div>

  {/* Footer */}

  <div

    style={{

      display: "flex",

      alignItems: "center",

      justifyContent: "space-between",

      flexWrap: "wrap",

      gap: "14px",

      marginTop: "16px",

    }}

  >

    <div

      style={{

        display: "flex",

        alignItems: "center",

        gap: "10px",

        minWidth: 0,

      }}

    >

      <span

        style={{

          display: "grid",

          flexShrink: 0,

          placeItems: "center",

          width: "34px",

          height: "34px",

          borderRadius: "10px",

          background: "#f0f5fc",

          color: "#6788ad",

        }}

      >

        <Icon name="clock" size={16} />

      </span>

      <span style={{ minWidth: 0 }}>

        <small

          style={{

            display: "block",

            marginBottom: "3px",

            color: "#93a4b7",

            fontSize: "7px",

            letterSpacing: "0.1em",

          }}

        >

          PEMBARUAN TERAKHIR

        </small>

        <strong

          style={{

            display: "block",

            overflow: "hidden",

            color: "#405e7d",

            fontSize: "9px",

            fontWeight: 650,

            textOverflow: "ellipsis",

            whiteSpace: "nowrap",

          }}

        >

          {latest

            ? `${dateText(latest.timestamp)} WIB`

            : "Menunggu data"}

        </strong>

      </span>

    </div>

    {hasCoords ? (

      <motion.a

        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}

        target="_blank"

        rel="noreferrer"

        style={{

          display: "flex",

          alignItems: "center",

          gap: "8px",

          color: "#3373dd",

          fontSize: "9px",

          fontWeight: 650,

          textDecoration: "none",

          whiteSpace: "nowrap",

        }}

        whileHover={

          motionEnabled && !reduced

            ? { x: 3 }

            : undefined

        }

      >

        Lihat lokasi

        <span

          style={{

            display: "grid",

            placeItems: "center",

            width: "28px",

            height: "28px",

            borderRadius: "50%",

            background: "#eaf2ff",

          }}

        >

          <Icon name="arrow" size={15} />

        </span>

      </motion.a>

    ) : (

      <span

        style={{

          color: "#9aaabd",

          fontSize: "9px",

        }}

      >

        Lokasi belum tersedia

      </span>

    )}

  </div>

</motion.section>

              </div>

              <section className="panel hardware-teaser">

                <div>

                  <span className="eyebrow">BEHIND THE DATA</span>

                  <h2>

                    Kenali teknologi

                    <br />

                    <em>di balik pengukuran.</em>

                  </h2>

                  <p>

                    Perangkat, susunan komponen, dan referensi wiring dalam satu

                    tempat.

                  </p>

                  <button

                    className="button"

                    onClick={() => navigate("hardware")}

                  >

                    Jelajahi perangkat <Icon name="arrow" size={17} />

                  </button>

                </div>

                <img

                  src={asset("assets/aqms-blueprint.svg")}

                  alt="Pratinjau blueprint susunan alat"

                  loading="lazy"

                />

              </section>

            </>

          )}

          {page === "hardware" && <Hardware />}

          {page === "analysis" && (

            <>

              <div className="stats-grid">

                {[

                  { label: "Rata-rata", value: average(chartRows, selected) },

                  {

                    label: "Minimum",

                    value: values.length

                      ? values.reduce((a, b) => Math.min(a, b), Infinity)

                      : null,

                  },

                  {

                    label: "Maksimum",

                    value: values.length

                      ? values.reduce((a, b) => Math.max(a, b), -Infinity)

                      : null,

                  },

                ].map((s) => (

                  <section className="panel stat" key={s.label}>

                    <span>

                      {s.label} · {metric.short}

                    </span>

                    <strong>

                      {fmt(s.value, 2)}

                      <small>{metric.unit}</small>

                    </strong>

                  </section>

                ))}

                <section className="panel stat">

                  <span>Rekaman pada rentang</span>

                  <strong>

                    {chartRows.length}

                    <small>data</small>

                  </strong>

                </section>

              </div>

              {graph}

              <section className="panel measurement-list">

                <div className="panel-heading">

                  <div>

                    <span className="eyebrow">SEMUA PARAMETER</span>

                    <h2>Pengukuran terakhir</h2>

                  </div>

                  <span className="subtle">

                    {dateText(latest?.timestamp)} WIB

                  </span>

                </div>

                <div className="parameter-grid">

                  {metrics.map((m) => (

                    <div key={m.key}>

                      <Icon name={m.icon} />

                      <span>{m.label}</span>

                      <strong>

                        {fmt(latest?.[m.key], 2)} <small>{m.unit}</small>

                      </strong>

                    </div>

                  ))}

                </div>

                <p className="note">

                  Pembacaan ditampilkan sesuai keluaran perangkat. Resistansi

                  gas bukan konsentrasi VOC. Kategori udara mengikuti backend

                  dan bukan penetapan ISPU/AQI oleh dashboard.

                </p>

              </section>

            </>

          )}

          {page === "history" && (

            <>

              <section className="panel history-panel">

                <div className="panel-heading">

                  <div>

                    <span className="eyebrow">ARSIP PENGUKURAN</span>

                    <h2>

                      Histori sensor{" "}

                      <span className="count">{filtered.length}</span>

                    </h2>

                  </div>

                  <div className="export-actions">

                    <button

                      className="button secondary"

                      disabled={!filtered.length}

                      onClick={() => exportCSV(filtered)}

                    >

                      <Icon name="download" size={16} />

                      CSV

                    </button>

                    <button

                      className="button secondary"

                      disabled={!filtered.length || exporting}

                      onClick={excel}

                    >

                      {exporting ? "Menyiapkan…" : "Excel"}

                    </button>

                    <button

                      className="button"

                      disabled={!filtered.length}

                      onClick={() => window.print()}

                    >

                      Cetak / PDF

                    </button>

                  </div>

                </div>

                <div className="filter-bar">

                  <label>

                    Dari tanggal

                    <input

                      type="date"

                      value={from}

                      max={to || undefined}

                      onChange={(e) => {

                        setFrom(e.target.value);

                        setTablePage(1);

                      }}

                    />

                  </label>

                  <label>

                    Sampai tanggal

                    <input

                      type="date"

                      value={to}

                      min={from || undefined}

                      onChange={(e) => {

                        setTo(e.target.value);

                        setTablePage(1);

                      }}

                    />

                  </label>

                  <button

                    className="text-button"

                    onClick={() => {

                      setFrom("");

                      setTo("");

                      setTablePage(1);

                    }}

                  >

                    Reset filter

                  </button>

                  <span className="subtle">Zona waktu WIB</span>

                </div>

                {from && to && from > to && (

                  <p role="alert" className="note">

                    Tanggal awal harus sebelum tanggal akhir.

                  </p>

                )}

                {exportError && <p role="alert">{exportError}</p>}

                <div className="print-heading">

                  <h2>Laporan BRIN Monitoring</h2>

                  <p>

                    {demo ? "DATA SIMULASI · " : ""}

                    {from || "Semua tanggal"} — {to || "terbaru"} ·{" "}

                    {filtered.length} rekaman

                  </p>

                </div>

                <div

                  className="table-scroll"

                  tabIndex="0"

                  role="region"

                  aria-label="Tabel histori sensor"

                >

                  <table>

                    <thead>

                      <tr>

                        <th>Waktu (WIB)</th>

                        {metrics.map((m) => (

                          <th key={m.key}>

                            {m.short}

                            <small>{m.unit}</small>

                          </th>

                        ))}

                      </tr>

                    </thead>

                    <tbody>

                      {filtered

                        .slice((safePage - 1) * 12, safePage * 12)

                        .map((r, i) => (

                          <tr key={`${r.id}-${i}`}>

                            <td>{dateText(r.timestamp)}</td>

                            {metrics.map((m) => (

                              <td key={m.key}>{fmt(r[m.key], 2)}</td>

                            ))}

                          </tr>

                        ))}

                    </tbody>

                  </table>

                  {!filtered.length && (

                    <div className="empty-state">

                      <Icon name="table" size={32} />

                      <h3>Belum ada rekaman</h3>

                      <p>

                        {rows.length

                          ? "Coba ubah rentang tanggal."

                          : "Hubungkan API atau aktifkan mode demo untuk mencoba."}

                      </p>

                    </div>

                  )}

                </div>

                <div className="pagination">

                  <span>

                    {filtered.length

                      ? `${(safePage - 1) * 12 + 1}–${Math.min(

                          safePage * 12,

                          filtered.length

                        )}`

                      : "0"}{" "}

                    dari {filtered.length} rekaman

                  </span>

                  <div>

                    <button

                      className="button secondary"

                      disabled={safePage <= 1}

                      onClick={() => setTablePage(safePage - 1)}

                    >

                      Sebelumnya

                    </button>

                    <span>

                      {safePage} / {pages}

                    </span>

                    <button

                      className="button secondary"

                      disabled={safePage >= pages}

                      onClick={() => setTablePage(safePage + 1)}

                    >

                      Berikutnya

                    </button>

                  </div>

                </div>

                {!demo && (

                  <div className="history-load">

                    <span>

                      {live.rows.length.toLocaleString("id-ID")} dari{" "}

                      {live.total.toLocaleString("id-ID")} rekaman dimuat

                    </span>

                    {live.hasMore && (

                      <button

                        className="button secondary"

                        disabled={live.loadingMore || live.loading}

                        onClick={live.loadMore}

                      >

                        {live.loadingMore ? "Memuat…" : "Muat data lebih lama"}

                      </button>

                    )}

                    {!live.hasMore &&

                      live.rows.length >= live.maxRows &&

                      live.total > live.rows.length && (

                        <span>

                          Batas {live.maxRows.toLocaleString("id-ID")} rekaman

                          tercapai.

                        </span>

                      )}

                  </div>

                )}

                {printing && (

                  <div className="print-only">

                    <table>

                      <thead>

                        <tr>

                          <th>Waktu (WIB)</th>

                          {metrics.map((m) => (

                            <th key={m.key}>

                              {m.short} ({m.unit})

                            </th>

                          ))}

                        </tr>

                      </thead>

                      <tbody>

                        {filtered.map((r, i) => (

                          <tr key={i}>

                            <td>{dateText(r.timestamp)}</td>

                            {metrics.map((m) => (

                              <td key={m.key}>{fmt(r[m.key], 2)}</td>

                            ))}

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

              </section>

              <p className="note">

                Filter dan ekspor mencakup rekaman yang sudah dimuat. CSV,

                Excel, dan PDF menggunakan seluruh hasil filter, bukan hanya

                halaman tabel saat ini.

              </p>

            </>

          )}

          {page === "about" && (

            <>

              <section className="panel about-hero">

                <div>

                  <span className="eyebrow">DARI SENSOR MENJADI INFORMASI</span>

                  <h2>

                    Memahami lingkungan,

                    <br />

                    <em>melalui pengukuran.</em>

                  </h2>

                  <p>

                    BRIN Monitoring menyajikan pengukuran kualitas udara dan

                    kondisi lingkungan dalam satu dashboard. Sistem ini

                    dikembangkan dalam kolaborasi riset BRIN dan Universitas

                    Sriwijaya.

                  </p>

                  <p>

                    Data membantu tim menelusuri perubahan kondisi, memeriksa

                    pembacaan sensor, dan menyiapkan bahan analisis penelitian.

                  </p>

                </div>

                <Device

                  key={activeDevice?.id + (activeDevice?.image || "")}

                  image="assets/iot out.png"

                  deviceId={activeDevice?.deviceId}

                />

              </section>

              <div className="stats-grid about-steps">

                {[

                  {

                    icon: "gauge",

                    title: "01. Pengukuran",

                    text: "Sensor merekam parameter udara dan lingkungan di stasiun pemantauan.",

                  },

                  {

                    icon: "air",

                    title: "02. Pengiriman",

                    text: "Perangkat mengirimkan pengukuran ke sistem penyimpanan.",

                  },

                  {

                    icon: "chart",

                    title: "03. Visualisasi",

                    text: "Dashboard mengambil data API secara berkala untuk menyajikan tren.",

                  },

                  {

                    icon: "download",

                    title: "04. Analisis",

                    text: "Data dapat ditelusuri, difilter, dan diekspor untuk keperluan riset.",

                  },

                ].map((s) => (

                  <section className="panel" key={s.title}>

                    <Icon name={s.icon} />

                    <h3>{s.title}</h3>

                    <p>{s.text}</p>

                  </section>

                ))}

              </div>

              <section className="panel about-note">

                <Icon name="info" />

                <div>

                  <h3>Tentang pembacaan data</h3>

                  <p>

                    Dashboard menampilkan nilai sensor, bukan klasifikasi resmi

                    kualitas udara. Kalibrasi alat, satuan pengukuran, dan

                    validasi data perlu mengacu pada perangkat yang digunakan.

                    Ilustrasi alat merupakan visual konsep dan dapat diganti

                    dengan foto perangkat sebenarnya.

                  </p>

                </div>

              </section>

            </>

          )}

          {page === "team" && (

            <>

              <section className="panel team-banner">

                <div>

                  <span className="eyebrow">KOLABORASI RISET</span>

                  <h2>

                    Di balik setiap

                    <br />

                    <em>data yang bermakna.</em>

                  </h2>

                  <p>

                    Tim pengembangan dan pembimbing sistem monitoring

                    lingkungan.

                  </p>

                  <span className="tag">BRIN × Universitas Sriwijaya</span>

                </div>

                <img

                  src={asset("assets/foto team.png")}

                  alt="Dokumentasi tim riset"

                  loading="lazy"

                />

              </section>

              <div className="team-grid">

                {team.map((member) => (

                  <article className="panel member-card" key={member.name}>

                    <img

                      src={asset(member.image)}

                      alt={member.name}

                      loading="lazy"

                    />

                    <div>

                      <small>{member.role}</small>

                      <h3>{member.name}</h3>

                    </div>

                  </article>

                ))}

              </div>

            </>

          )}

          <footer>

            <span>

              <strong>BRIN</strong> Monitoring{" "}

              <span className="footer-separator">/</span> Lingkungan dalam data.

            </span>

            <span>BRIN × Universitas Sriwijaya</span>

          </footer>

        </motion.main>

      </div>

    </div>

  );

}

export default function App() {

  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

  return (

    <MotionConfig reducedMotion="user">

      <BrowserRouter basename={basename}>

        <AuthProvider>

          <Routes>

            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<Admin />} />

            <Route path="/aqms_ng" element={<Dashboard />} />

            <Route path="*" element={<NotFound />} />

          </Routes>

        </AuthProvider>

      </BrowserRouter>

    </MotionConfig>

  );

}

