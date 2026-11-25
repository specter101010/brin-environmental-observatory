import { memo, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { number, fmt, dateText } from "../utils/data";
function Trend({ rows, metric }) {
  const id = useId().replaceAll(":", "");
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(null);
  const data = [...rows].reverse().slice(-60);
  const valid = data
    .map((r) => number(r[metric.key]))
    .filter((v) => v !== null);
  if (!valid.length)
    return (
      <div className="chart-empty">
        <span>Belum ada data untuk ditampilkan</span>
        <small>Grafik akan muncul saat data sensor tersedia.</small>
      </div>
    );
  const min = Math.min(...valid),
    max = Math.max(...valid),
    pad = Math.max((max - min) * 0.2, Math.abs(max) * 0.01, 0.1);
  const low = min - pad,
    high = max + pad;
  const x = (i) => 54 + (i / Math.max(data.length - 1, 1)) * 876;
  const y = (v) => 175 - ((v - low) / (high - low)) * 145;
  let path = "",
    move = true;
  data.forEach((r, i) => {
    const v = number(r[metric.key]);
    if (v === null) {
      move = true;
      return;
    }
    path += `${move ? "M" : "L"}${x(i)},${y(v)} `;
    move = false;
  });
  const validIndexes = data.flatMap((row, index) =>
    number(row[metric.key]) === null ? [] : [index],
  );
  const activeIndex = hovered === null
    ? null
    : validIndexes.reduce((nearest, index) =>
        Math.abs(index - hovered) < Math.abs(nearest - hovered) ? index : nearest,
      validIndexes[0]);
  const activeRow = activeIndex === null ? null : data[activeIndex];
  const activeValue = activeRow ? number(activeRow[metric.key]) : null;
  const selectPoint = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
    setHovered(Math.round(ratio * Math.max(data.length - 1, 0)));
  };
  const moveWithKeyboard = (direction) => {
    const current = activeIndex ?? validIndexes.at(-1);
    const position = validIndexes.indexOf(current);
    const next = Math.max(0, Math.min(validIndexes.length - 1, position + direction));
    setHovered(validIndexes[next]);
  };
  return (
    <div className="trend" onPointerLeave={() => setHovered(null)}>
      <svg
        viewBox="0 0 950 215"
        role="img"
        aria-label={`Grafik ${metric.label}, minimum ${fmt(min)}, maksimum ${fmt(max)} ${metric.unit}`}
        tabIndex="0"
        onPointerMove={selectPoint}
        onFocus={() => setHovered(validIndexes.at(-1))}
        onBlur={() => setHovered(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveWithKeyboard(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop stopColor={metric.color} stopOpacity=".14" />
            <stop offset="1" stopColor={metric.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="54"
              x2="930"
              y1={30 + (i * 145) / 3}
              y2={30 + (i * 145) / 3}
              stroke="#e7eeea"
              strokeDasharray="4 5"
            />
            <text x="0" y={34 + (i * 145) / 3}>
              {fmt(high - (i * (high - low)) / 3)}
            </text>
          </g>
        ))}
        {valid.length === data.length && (
          <path
            d={`${path}L${x(data.length - 1)},180 L54,180 Z`}
            fill={`url(#${id})`}
          />
        )}
        <motion.path
          key={`${metric.key}-${data.length}`}
          className="chart-line"
          d={path}
          fill="none"
          stroke={metric.color}
          strokeWidth="2.7"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: .7, ease: "easeOut" }}
        />
        {data.map(
          (r, i) =>
            number(r[metric.key]) !== null && (
              <circle
                key={i}
                cx={x(i)}
                cy={y(Number(r[metric.key]))}
                r={data.length === 1 ? 4 : 2}
                fill={metric.color}
              >
                <title>
                  {dateText(r.timestamp)} · {fmt(r[metric.key], 2)}{" "}
                  {metric.unit}
                </title>
              </circle>
            ),
        )}
        {[
          ...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
        ].map((i) => (
          <text
            key={i}
            x={x(i)}
            y="207"
            textAnchor={
              i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"
            }
          >
            {dateText(data[i].timestamp, true)}
          </text>
        ))}
        {activeRow && activeValue !== null && (
          <motion.g
            className="chart-focus"
            initial={reduce ? false : { opacity: 0, scale: .8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: .16 }}
          >
            <line x1={x(activeIndex)} x2={x(activeIndex)} y1="26" y2="180" />
            <circle cx={x(activeIndex)} cy={y(activeValue)} r="9" fill={metric.color} opacity=".16" />
            <circle cx={x(activeIndex)} cy={y(activeValue)} r="4" fill={metric.color} />
          </motion.g>
        )}
      </svg>
      {activeRow && activeValue !== null && (
        <motion.div
          className="chart-tooltip"
          style={{ left: `${(x(activeIndex) / 950) * 100}%` }}
          initial={reduce ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          <strong>{fmt(activeValue, 2)} {metric.unit}</strong>
          <span>{dateText(activeRow.timestamp)}</span>
        </motion.div>
      )}
    </div>
  );
}

export default memo(Trend);
