import type { Plugin } from "vite";
import { createHash } from "node:crypto";
import postcss, { type Root } from "postcss";
import cascadeLayers from "@csstools/postcss-cascade-layers";

// Old Android System WebView (Chromium < 99, used by the LINE in-app browser and
// the Capacitor Android app) chokes on two things Tailwind v4 emits. Standalone
// Chrome on the same device is newer and renders fine, which masks both bugs.
//
//  1. @layer (cascade layers, Chrome 99+): Tailwind wraps EVERY rule in a layer,
//     so an unsupporting WebView drops all of them — including Tailwind's own
//     old-browser fallbacks — and the page renders as unstyled HTML.
//
//  2. color-mix() opacity (Chrome 111+): Tailwind expresses `/<alpha>` color
//     modifiers (e.g. `bg-primary/10`) as `color-mix(... 10%, transparent)` behind
//     an @supports guard, with a SOLID, fully-opaque color as the fallback. On old
//     WebViews every translucent tint therefore renders as a solid block (the giant
//     red blobs on the bottom-nav active indicator and the filter toggle).
//
// This plugin post-processes the bundled CSS to (1) flatten @layer into
// specificity-equivalent plain rules and (2) rewrite the solid opacity fallbacks
// into real alpha colors. It only ever touches the fallbacks old engines use —
// the @supports(color-mix) rules that modern engines (desktop/mobile Chrome, iOS
// WKWebView, updated Android) actually apply are left byte-for-byte unchanged, so
// the web and iOS apps render identically to before.

// `hsl(var(--x))` / `hsl(h s% l%)` / `rgb(...)` / white / black -> same color with alpha.
// Returns null for colors we can't safely add alpha to (currentColor, hex, named).
function withAlpha(color: string, alpha: number): string | null {
  const a = Math.round(alpha * 1000) / 1000;
  const trimmed = color.trim();
  if (trimmed.toLowerCase() === "white") return `rgb(255 255 255 / ${a})`;
  if (trimmed.toLowerCase() === "black") return `rgb(0 0 0 / ${a})`;
  const fn = trimmed.match(/^(hsla?|rgba?)\((.*)\)$/i);
  if (!fn) return null;
  const inner = fn[2].trim();
  if (inner.includes("/")) return null; // already has an alpha channel
  const base = fn[1].replace(/a$/i, "");
  return `${base}(${inner} / ${a})`;
}

function fixModernCss() {
  return {
    postcssPlugin: "fix-modern-css",
    OnceExit(root: Root) {
      // (a) Gradient interpolation. Tailwind v4 bakes `in oklab` into the
      // gradient direction (`--tw-gradient-position: to right in oklab`), so the
      // resolved `linear-gradient(to right in oklab, ...)` is unparsable below
      // Chrome 111 — the whole gradient is dropped. That blanks every decorative
      // gradient AND makes `bg-clip-text text-transparent` gradient text invisible
      // (the missing word in the "ログインして、◯◯を。" hero). Strip the
      // interpolation hint so gradients fall back to sRGB, which every engine
      // supports and which renders identically on modern engines too.
      root.walkDecls("--tw-gradient-position", (decl) => {
        const stripped = decl.value
          .replace(/\s*\bin okl(?:ab|ch)\b/g, "")
          .trim();
        if (stripped && stripped !== decl.value.trim()) decl.value = stripped;
      });

      // (a2) Dynamic viewport units. dvh/svh/lvh need Chrome 108+; below that the
      // whole declaration is invalid and dropped, so full-height containers collapse
      // to 0. The map page's root uses `h-dvh` (Layout), so the map gets 0 height and
      // renders blank on old WebViews. Emit a `vh` fallback BEFORE each dynamic-unit
      // declaration: old engines use vh, modern engines override with the dvh value
      // that follows — so modern rendering is unchanged.
      root.walkDecls((decl) => {
        const fallback = decl.value.replace(/(\d)(?:dvh|svh|lvh)\b/g, "$1vh");
        if (fallback !== decl.value) decl.cloneBefore({ value: fallback });
      });

      // (b) Opacity color fallbacks.
      const bySelector = new Map<string, postcss.Rule[]>();
      root.each((node) => {
        if (node.type === "rule") {
          const list = bySelector.get(node.selector);
          if (list) list.push(node);
          else bySelector.set(node.selector, [node]);
        }
      });

      root.walkAtRules("supports", (supports) => {
        if (!supports.params.includes("color-mix")) return;
        supports.walkDecls((decl) => {
          const m = decl.value.match(
            /^color-mix\(in [\w-]+,\s*(.+?)\s+([\d.]+)%,\s*transparent\)\s*$/,
          );
          if (!m) return;
          const alphaColor = withAlpha(m[1], parseFloat(m[2]) / 100);
          if (!alphaColor) return;
          const parentRule = decl.parent;
          if (!parentRule || parentRule.type !== "rule") return;
          const fallbacks = bySelector.get(parentRule.selector);
          if (!fallbacks) return;
          for (const rule of fallbacks) {
            rule.walkDecls(decl.prop, (fb) => {
              if (fb.value === m[1].trim()) fb.value = alphaColor;
            });
          }
        });
      });
    },
  };
}
fixModernCss.postcss = true;

async function transformCss(css: string, from: string): Promise<string> {
  const flattened = (await postcss([cascadeLayers()]).process(css, { from }))
    .css;
  return (await postcss([fixModernCss()]).process(flattened, { from }))
    .css;
}

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

        const transformed = await transformCss(css, file.fileName);
        file.source = transformed;

        // Vite derives the asset hash from the pre-transform content, so a
        // config-only change (like adding this plugin) reuses the old filename
        // and lets clients keep a stale, broken copy cached under the immutable
        // `Cache-Control: max-age=31536000`. Re-hash from the transformed content
        // so the URL changes whenever the actually-served CSS changes.
        const hash = createHash("sha256")
          .update(transformed)
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
