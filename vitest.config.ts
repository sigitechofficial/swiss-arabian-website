import { defineConfig } from "vitest/config";
import path from "node:path";
import react from "@vitejs/plugin-react";

// Node 25+ ships its own `localStorage` global (on by default) that hides
// jsdom's and throws without `--localstorage-file`. Tests use jsdom's.
const nodeMajor = Number(process.versions.node.split(".")[0]);
const execArgv = nodeMajor >= 25 ? ["--no-experimental-webstorage"] : [];

export default defineConfig({
  plugins: [react()],
  test: {
    execArgv,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Tests run against Swiss Arabian's UI unless BRAND_UI_THEME is set (see src/brands/README.md).
      "@brand-ui/client": path.resolve(__dirname, `./src/brands/${process.env.BRAND_UI_THEME || "swiss-arabian"}/brand-ui.client.ts`),
      "@brand-ui": path.resolve(__dirname, `./src/brands/${process.env.BRAND_UI_THEME || "swiss-arabian"}/brand-ui.ts`),
      // Provided by the Next compiler; tests read the default locale.
      "next/root-params": path.resolve(__dirname, "./src/test/rootParamsStub.ts"),
    },
  },
});
