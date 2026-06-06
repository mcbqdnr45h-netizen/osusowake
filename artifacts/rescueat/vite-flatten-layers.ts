import type { Plugin } from "vite";
import postcss from "postcss";
import cascadeLayers from "@csstools/postcss-cascade-layers";

// Tailwind v4 wraps every generated rule in CSS cascade layers (@layer) and
// guards its modern color output behind @supports(color-mix(...)) — emitting
// old-browser fallbacks for everything else. Android System WebView < Chromium 99
// (used by the LINE in-app browser and the Capacitor Android app) does not support
// @layer, so it drops EVERY layered rule, fallbacks included, and the page renders
// completely unstyled. Standalone Chrome on the same device is newer and works.
// Flatten @layer into specificity-equivalent plain CSS after bundling so the styles
// apply on those WebViews; modern browsers render identically.
export function flattenCascadeLayers(): Plugin {
  return {
    name: "flatten-cascade-layers",
    apply: "build",
    async generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".css")) continue;
        const css =
          typeof file.source === "string"
            ? file.source
            : Buffer.from(file.source).toString("utf8");
        if (!css.includes("@layer")) continue;
        const result = await postcss([cascadeLayers()]).process(css, {
          from: file.fileName,
        });
        file.source = result.css;
      }
    },
  };
}
