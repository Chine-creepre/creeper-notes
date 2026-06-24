import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import packageJson from "./package.json";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const getPackageName = (id: string) => {
  const normalizedId = id.replace(/\\/g, "/");
  const nodeModulesIndex = normalizedId.lastIndexOf("/node_modules/");

  if (nodeModulesIndex < 0) return "";

  const modulePath = normalizedId.slice(nodeModulesIndex + "/node_modules/".length);
  const [firstSegment, secondSegment] = modulePath.split("/");

  if (!firstSegment) return "";
  if (firstSegment.startsWith("@") && secondSegment) return `${firstSegment}/${secondSegment}`;

  return firstSegment;
};

const resolveManualChunk = (id: string) => {
  const packageName = getPackageName(id);

  if (!packageName) return undefined;

  if (["vue", "vue-router", "pinia"].includes(packageName) || packageName.startsWith("@vue/")) {
    return "vendor-vue";
  }

  if (packageName === "md-editor-v3" || packageName.startsWith("@vavt/")) {
    return "vendor-md-editor";
  }

  if (packageName === "codemirror" || packageName.startsWith("@codemirror/") || packageName.startsWith("@lezer/")) {
    return "vendor-md-editor-codemirror";
  }

  if (["marked", "medium-zoom", "screenfull", "cropperjs", "xss"].includes(packageName)) {
    return "vendor-md-editor-markdown";
  }

  if (packageName.startsWith("@wangeditor/")) {
    return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
  }

  if (["slate", "snabbdom"].includes(packageName) || packageName.startsWith("slate-")) {
    return `vendor-${packageName}`;
  }

  if (packageName === "highlight.js") {
    return "vendor-highlight";
  }

  if (packageName.startsWith("@tauri-apps/")) {
    return "vendor-tauri";
  }

  if (packageName === "@iconify/vue") {
    return "vendor-iconify";
  }

  return "vendor";
};

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
      },
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
