
import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const base = env.VITE_BASE_PATH || "/";

  if (!base.startsWith("/") || !base.endsWith("/")) {
    throw new Error(
      "VITE_BASE_PATH harus diawali dan diakhiri /"
    );
  }

  return {
    base,
    plugins: [react()],

    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      allowedHosts: [
        "arc.ilkom.unsri.ac.id"
      ],
    },
  };
});
