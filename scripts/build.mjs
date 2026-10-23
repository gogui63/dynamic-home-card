// Bundles src/ into a single ES module for Home Assistant: dist/dynamic-home-card.js
// No dependencies: modules are concatenated in dependency order and import/export lines are stripped.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const order = ["src/engine/aurora-engine.js", "src/i18n.js", "src/styles.js", "src/logic.js", "src/card.js"];

const strip = (src) => src
  .replace(/^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];\s*$/gm, "")
  .replace(/^export\s*\{[^}]*\};?\s*$/gm, "")
  .replace(/^export\s+(const|function|class|let)\s/gm, "$1 ");

const banner = `/*! Dynamic Home Card v${pkg.version} — https://github.com/gogui63/dynamic-home-card
 *  License: GPL-3.0-or-later. Contains code derived from Aurora Glass v3
 *  © 2026 DomotikPro.it (Luca Pinelli), GPL-3.0 — https://github.com/lucalux00/aurora-glass-v3
 *  Generated file: edit src/ and run \`npm run build\`. */\n`;

const body = order.map((f) => `/* ---- ${f} ---- */\n` + strip(readFileSync(join(root, f), "utf8"))).join("\n");
const out = banner + "(() => {\n\"use strict\";\n" + body.replace(/__VERSION__/g, pkg.version) + "\n})();\n";
mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "dynamic-home-card.js"), out);
console.log(`dist/dynamic-home-card.js  ${(out.length / 1024).toFixed(1)} KiB  v${pkg.version}`);
