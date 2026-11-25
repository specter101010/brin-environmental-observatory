import { asset, imageSource } from "../utils/api";
import { memo, useRef } from "react";
const Device = memo(function Device({ image, deviceId = "01" }) {
  const ref = useRef(null);
  const source =
    imageSource(image || import.meta.env.VITE_DEVICE_IMAGE || "assets/aqms-device.svg");
  function tilt(e) {
    if (
      e.pointerType !== "mouse" ||
      document.documentElement.classList.contains("motion-paused") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const r = e.currentTarget.getBoundingClientRect();
    ref.current.style.transform = `rotateX(${(-(e.clientY - r.top - r.height / 2) / r.height) * 6}deg) rotateY(${((e.clientX - r.left - r.width / 2) / r.width) * 9}deg)`;
  }
  return (
    <div
      className="device-scene"
      onPointerMove={tilt}
      onPointerLeave={() => {
        ref.current.style.transform = "";
      }}
    >
      <div className="device-plinth" />
      <div className="device-model" ref={ref}>
        <img
          src={source}
          onError={(e) => {
            if (e.currentTarget.dataset.fallback) return;
            e.currentTarget.dataset.fallback = "1";
            e.currentTarget.src = asset("assets/aqms-device.svg");
          }}
          alt="Ilustrasi 3D konsep sensor AQMS tampak depan"
        />
        <span className="device-label label-top">
          <i /> ENVIRONMENTAL SENSOR
        </span>
        <span className="device-label label-bottom">
          AQMS <b>{deviceId}</b>
        </span>
      </div>
      <span className="scene-label">PRECISION IN EVERY READING</span>
      <span className="concept-label">VISUAL KONSEP</span>
    </div>
  );
});
export default Device;
