// Choose the actual output produced by your sensor/firmware; never infer ppm from resistance.
const env = import.meta.env || {};
export const vocMode = env.VITE_VOC_MODE === "tvoc" ? "tvoc" : "resistance";
export const metrics = [
  {
    key: "wind_speed_ms",
    label: "Kecepatan angin",
    short: "Angin",
    unit: "m/s",
    icon: "air",
    color: "#2479ef",
  },
  {
    key: "suhu_dht",
    label: "Suhu udara",
    short: "Suhu",
    unit: "°C",
    icon: "temp",
    color: "#fa9c47",
  },
  {
    key: "tekanan_bmp",
    label: "Tekanan udara",
    short: "Tekanan",
    unit: "hPa",
    icon: "gauge",
    color: "#7277e3",
  },
  {
    key: "voc_value",
    label: "Kualitas udara · VOC",
    short: "VOC",
    unit: vocMode === "tvoc" ? "ppb" : "kΩ",
    icon: "air",
    color: "#2178f4",
  },
  {
    key: "co_ppm",
    label: "Karbon monoksida",
    short: "CO",
    unit: "ppm",
    icon: "flask",
    color: "#2c88c9",
  },
  {
    key: "co2_ppm",
    label: "Karbon dioksida",
    short: "CO₂",
    unit: "ppm",
    icon: "air",
    color: "#3774e5",
  },
  {
    key: "nh3_ppm",
    label: "Amonia",
    short: "NH₃",
    unit: "ppm",
    icon: "flask",
    color: "#8583db",
  },
  {
    key: "dust_ppm",
    label: "Partikel debu",
    short: "Dust",
    unit: env.VITE_DUST_UNIT || "ppm",
    icon: "dust",
    color: "#4c9caf",
  },
];
export const number = (v) =>
  (typeof v !== "number" && typeof v !== "string") ||
  v === null ||
  v === undefined ||
  String(v).trim() === "" ||
  !Number.isFinite(Number(v))
    ? null
    : Number(v);
export const fmt = (v, digits = 1) =>
  number(v) === null
    ? "—"
    : Number(v).toLocaleString("id-ID", { maximumFractionDigits: digits });
export const timestamp = (v) => {
  if (!v) return NaN;
  // Subscriber v2 writes UTC; older WIB data can opt into +07:00 in env.
  const s = String(v).trim();
  return Date.parse(
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)
      ? s.replace(" ", "T") + (env.VITE_API_TIMEZONE === "Asia/Jakarta" ? "+07:00" : "Z")
      : s,
  );
};
export const dateText = (v, short = false) =>
  Number.isFinite(timestamp(v))
    ? new Date(timestamp(v)).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        ...(short ? {} : { day: "2-digit", month: "short", year: "numeric" }),
        hour: "2-digit",
        minute: "2-digit",
        ...(short ? {} : { second: "2-digit" }),
      })
    : "—";
export const dayKey = (v) =>
  Number.isFinite(timestamp(v))
    ? new Date(timestamp(v) + 7 * 3600000).toISOString().slice(0, 10)
    : "";
export const average = (rows, key) => {
  const values = rows.map((r) => number(r[key])).filter((v) => v !== null);
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
};
// Only map fields with known compatible units. wind_vane is NOT a wind speed.
export function normalizeRecord(row) {
  const pick = (...keys) => {
    for (const key of keys) {
      const value = number(row[key]);
      if (value !== null) return value;
    }
    return null;
  };
  return {
    ...row,
    timestamp: row.timestamp || row.created_at,
    wind_speed_ms: pick("wind_speed_ms", "wind_speed_mps"),
    suhu_dht: pick("suhu_dht", "temperature"),
    tekanan_bmp: pick("tekanan_bmp", "pressure_hpa", "pressure"),
    voc_value:
      vocMode === "tvoc"
        ? pick("tvoc_ppb", "voc_ppb")
        : (pick("gas_resistance_kohm", "gas_resistance_kOhm") ??
          (pick("gas_resistance_ohm") === null
            ? null
            : pick("gas_resistance_ohm") / 1000)),
    co_ppm: pick("co_ppm"),
    co2_ppm: pick("co2_ppm"),
    nh3_ppm: pick("nh3_ppm"),
    dust_ppm: pick(env.VITE_DUST_FIELD || "dust_ppm"),
  };
}
export function airCondition(row) {
  const label = String(row?.iaq_category || "")
    .trim()
    .toLowerCase();
  if (["baik", "good"].includes(label))
    return {
      label: "Baik",
      tone: "clear",
      detail: "Kategori udara dari perangkat",
    };
  if (["sedang", "moderate"].includes(label))
    return {
      label: "Sedang",
      tone: "moderate",
      detail: "Kategori udara dari perangkat",
    };
  if (["buruk", "poor", "bad"].includes(label))
    return {
      label: "Buruk",
      tone: "poor",
      detail: "Kategori udara dari perangkat",
    };
  return {
    label: "Belum diklasifikasikan",
    tone: "unknown",
    detail: "Kategori udara belum dikirim perangkat",
  };
}
export const demoRows = () =>
  Array.from({ length: 96 }, (_, i) => ({
    id: `demo-${i}`,
    timestamp: new Date(Date.now() - i * 15 * 60000).toISOString(),
    co2_ppm: Math.round(420 + Math.sin(i * 0.31) * 32 + Math.cos(i * 0.8) * 8),
    dust_ppm: +(18 + Math.sin(i * 0.24) * 3).toFixed(2),
    nh3_ppm: +(1.2 + Math.sin(i * 0.38) * 0.4).toFixed(2),
    suhu_dht: +(28.4 + Math.sin(i * 0.12) * 2.1).toFixed(1),
    co_ppm: +(0.7 + Math.sin(i * 0.2) * 0.15).toFixed(2),
    voc_value: +(
      vocMode === "tvoc"
        ? 128 + Math.sin(i * 0.2) * 25
        : 92 + Math.sin(i * 0.2) * 9
    ).toFixed(1),
    iaq_category: "Baik",
    wind_speed_ms: +(2.4 + Math.sin(i * 0.3) * 1.1).toFixed(1),
    tekanan_bmp: +(1009 + Math.sin(i * 0.14) * 2).toFixed(1),
    latitude: null,
    longitude: null,
  }));
export function exportCSV(rows) {
  const keys = [
    "id",
    "timestamp",
    ...metrics.map((m) => m.key),
    "latitude",
    "longitude",
  ];
  const escape = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const csv =
    "\uFEFF" +
    [keys, ...rows.map((r) => keys.map((k) => r[k]))]
      .map((r) => r.map(escape).join(","))
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "brin-monitoring.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
