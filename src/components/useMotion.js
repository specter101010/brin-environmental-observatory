import { useEffect } from "react";
export default function useMotion(page, enabled) {
  useEffect(() => {
    const update = () => {
      document.documentElement.classList.toggle(
        "motion-paused",
        !enabled || document.hidden,
      );
    };
    update();
    document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          e.target.classList.toggle("in-view", e.isIntersecting),
        ),
      { rootMargin: "60px" },
    );
    document
      .querySelectorAll(".air-visual,.device-scene,.hardware-visual")
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [page, enabled]);
}
