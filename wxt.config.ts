import { defineConfig } from "wxt";
import Icons from "unplugin-icons/vite";
import Tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  experimental: {
    entrypointImporter: "vite-node",
  },
  modules: [
    "@wxt-dev/module-vue",
    "@wxt-dev/auto-icons",
  ],
  imports: {
    presets: ["vue-router"],
    imports: [
      { from: "@tanstack/vue-query", name: "useQuery" },
      { from: "@tanstack/vue-query", name: "useMutation" },
    ],
  },
  runner: {
    disabled: true,
  },
  vite: () => ({
    plugins: [Icons({ compiler: "vue3" }), Tailwindcss() as any],
    ssr: {
      // List any dependencies that depend on webextension-polyfill here for vite-node importer to work
      noExternal: ["@webext-core/proxy-service", "@webext-core/messaging"],
    },
  }),
  manifest: ({ browser }) => {
    const permissions = ["storage", "tabs"];

    return {
      name: "weather-extension",
      description: "weather-extension",
      permissions,
      host_permissions: ["<all_urls>"],
    };
  },
  autoIcons: {
    grayscaleOnDevelopment: false,
  },
});
