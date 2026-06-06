import type { Plugin } from "vite";
import { createHash } from "node:crypto";
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
    enforce: "post",
    async generateBundle(_options, bundle) {
      const renames: Record<string, string> = {};

      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || !file.fileName.endsWith(".css")) continue;
        const css =
          typeof file.source === "string"
            ? file.source
            : Buffer.from(file.source).toString("utf8");
        if (!css.includes("@layer")) continue;

        const flattened = (
          await postcss([cascadeLayers()]).process(css, { from: file.fileName })
        ).css;
        file.source = flattened;

        // Vite derives the asset hash from the pre-flatten content, so a
        // config-only change (like adding this plugin) reuses the old filename
        // and lets clients keep a stale, broken copy cached under the immutable
        // `Cache-Control: max-age=31536000`. Re-hash from the flattened content
        // so the URL changes whenever the actually-served CSS changes.
        const hash = createHash("sha256")
          .update(flattened)
          .digest("hex")
          .slice(0, 8);
        const newName = file.fileName.replace(/-[^-/]+\.css$/, `-${hash}.css`);
        if (newName !== file.fileName) renames[file.fileName] = newName;
      }

      if (Object.keys(renames).length === 0) return;

      for (const [oldName, newName] of Object.entries(renames)) {
        const file = bundle[oldName];
        delete bundle[oldName];
        file.fileName = newName;
        bundle[newName] = file;
      }

      // Rewrite references to the renamed CSS in HTML entries and JS chunks.
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".html")) {
          let html =
            typeof file.source === "string"
              ? file.source
              : Buffer.from(file.source).toString("utf8");
          for (const [oldName, newName] of Object.entries(renames)) {
            html = html.split(oldName).join(newName);
          }
          file.source = html;
        } else if (file.type === "chunk") {
          for (const [oldName, newName] of Object.entries(renames)) {
            if (file.code.includes(oldName)) {
              file.code = file.code.split(oldName).join(newName);
            }
          }
        }
      }
    },
  };
}
