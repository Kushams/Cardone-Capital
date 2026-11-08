/**
 * Copies the portal images from images/ into public/images/ so they ship as
 * static assets. On Cloudflare Workers there is no project disk for the
 * /images route handler to read from, so the images must exist as bundled
 * assets (OpenNext copies public/ into the Worker's asset directory).
 * images/ stays the single source of truth; public/images/ is regenerated
 * on every build (prebuild) and should not be edited by hand.
 */
import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "images");
const dst = path.join(root, "public", "images");
const EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

let copied = 0;
function walk(dir, rel = "") {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const r = path.join(rel, name);
    if (statSync(full).isDirectory()) walk(full, r);
    else if (EXTS.has(path.extname(name).toLowerCase())) {
      mkdirSync(path.dirname(path.join(dst, r)), { recursive: true });
      cpSync(full, path.join(dst, r));
      copied++;
    }
  }
}
walk(src);
console.log(`sync-public-images: copied ${copied} images to public/images/`);
