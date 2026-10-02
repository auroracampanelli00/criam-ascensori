import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : "/",
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0",
      port: Number.parseInt(process.env.PORT || "8443", 10),
      strictPort: true,
      watch: {
        ignored: ["**/.figma/**"],
      },
    },
  },
  server: {
    host: process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0",
    port: Number.parseInt(process.env.PORT || "8443", 10),
  },
});
