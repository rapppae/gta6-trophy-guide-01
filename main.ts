// Hand-in script for the GTA 6 trophy guide entry (Node 22, no dependencies).
// Copies app/ and screenshots/ next to this file into the output directory,
// then builds the make.fun dossier for that directory and writes dossier.json.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader's container MAKEFUN_OUTPUT_DIR stands in for /output.
import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(fileURLToPath(new URL('.', import.meta.url)));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

if (!existsSync(join(here, 'app', 'index.html'))) fail('app/index.html is missing, nothing to hand in');
if (!existsSync(join(here, 'app', 'data', 'trophies.json'))) fail('app/data/trophies.json is missing, nothing to hand in');
const shots = existsSync(join(here, 'screenshots'))
  ? readdirSync(join(here, 'screenshots')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];
if (shots.length === 0) fail('screenshots/ holds no image: take the screenshots first (see shots.json), the first is the cover');

mkdirSync(out, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const target = join(out, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(here, name), target, { recursive: true });
}

const dossier = buildDossier(out, caps);
if (!dossier || dossier.length === 0) fail('buildDossier returned an empty dossier');
try {
  const parsed = JSON.parse(new TextDecoder().decode(dossier));
  if (!parsed || typeof parsed !== 'object') fail('buildDossier returned bytes that are not a JSON object');
} catch {
  fail('buildDossier returned bytes that are not valid JSON');
}
writeFileSync(join(out, 'dossier.json'), dossier);

const appFiles = statSync(join(out, 'app')).isDirectory() ? 'ok' : 'missing';
console.log(`main.ts: wrote ${join(out, 'dossier.json')} (${dossier.length} bytes), app/ ${appFiles}`);
