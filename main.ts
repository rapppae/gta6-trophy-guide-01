// Hand-in builder for the GTA 6 trophy guide entry.
//
// What it does, in plain terms: it takes the finished guide in app/ and the
// screenshots in screenshots/, copies both into the output folder, and asks
// the vendored make.fun library to summarise the whole entry as dossier.json.
// The output folder comes from MAKEFUN_OUTPUT_DIR, or /output when that is
// not set (the grader's container sets it). Run it like this:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Node 22, standard library only, no build step. The vendor library is used
// exactly as shipped in vendor/ and is never edited here.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");

function fail(message: string): never {
  throw new Error(`gta6-trophy-guide-01 hand-in failed: ${message}`);
}

// Sanity checks with readable errors, so a broken hand-in says what is wrong
// instead of dying deep inside the dossier builder.
if (!existsSync(appDir) || !statSync(appDir).isDirectory()) fail("app/ is missing from the repo");
if (!existsSync(join(appDir, "index.html"))) fail("app/index.html is missing");
if (!existsSync(join(appDir, "data", "trophies.json"))) fail("app/data/trophies.json is missing");
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).length === 0) {
  fail("screenshots/ has no PNG or JPEG files");
}
for (const shot of readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f))) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) fail(`screenshots/${shot} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, "app"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
cpSync(shotsDir, join(outputDir, "screenshots"), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);

console.log(`Hand-in written to ${outputDir} (${dossier.length} bytes of dossier).`);
