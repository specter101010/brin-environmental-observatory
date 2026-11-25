import { memo } from "react";
import { number } from "../utils/data";
// Transform/opacity only. The small, fixed particle count does not grow with data size.
const AirVisual = memo(function AirVisual({
  tone = "unknown",
  wind,
  compact = false,
}) {
  const speed = number(wind);
  const duration =
    speed === null ? 12 : Math.max(4, 15 - Math.max(0, speed) * 1.2);
  return (
    <div
      className={`air-visual air-${tone} ${compact ? "air-compact" : ""}`}
      style={{ "--flow-duration": `${duration}s` }}
      aria-hidden="true"
    >
      <div className="air-halo halo-a" />
      <div className="air-halo halo-b" />
      <div className="air-streams">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="air-particles">
        {Array.from({ length: 10 }, (_, i) => (
          <i
            key={i}
            style={{
              "--x": `${(i * 37 + 9) % 100}%`,
              "--y": `${(i * 19 + 13) % 95}%`,
              "--delay": `${-i * 1.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
});
export default AirVisual;
