// Leonida Platinum Path — a GTA 6 trophy guide and tracker for make.fun's
// gta6-trophy-guide-01 bounty. The guide itself is app/: plain static files
// (index.html, app.js, style.css, data/trophies.json) that open in a desktop
// browser and work offline. This program hands it in: it copies app/ and
// screenshots/ from beside this file to the output directory and writes
// dossier.json there with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to
// be byte for byte what its own copy writes.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');
if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
  console.error('main.ts: app/ is missing beside main.ts — nothing to hand in.');
  process.exit(1);
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  console.error('main.ts: screenshots/ is missing beside main.ts — take 3 or 4 screenshots first.');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

let dossier;
try {
  dossier = buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 });
} catch (err) {
  console.error('main.ts: buildDossier refused the entry: ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
const target = join(out, 'dossier.json');
writeFileSync(target, dossier);
console.log('main.ts: wrote ' + target + ' (' + statSync(target).size + ' bytes)');
