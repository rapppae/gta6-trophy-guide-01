import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function copyTree(sourceDir: string, targetDir: string): number {
  mkdirSync(targetDir, { recursive: true });
  let copied = 0;
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const from = join(sourceDir, entry.name);
    const to = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

function handIn(): void {
  const appDir = join(REPO_ROOT, "app");
  const shotsDir = join(REPO_ROOT, "screenshots");
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
    throw new Error("app/ is missing from the repository root: " + appDir);
  }
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
    throw new Error("screenshots/ is missing from the repository root: " + shotsDir);
  }
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const appFiles = copyTree(appDir, join(OUTPUT_DIR, "app"));
  const shotFiles = copyTree(shotsDir, join(OUTPUT_DIR, "screenshots"));
  if (appFiles === 0) throw new Error("app/ has no files to hand in.");
  if (shotFiles < 3 || shotFiles > 4) {
    throw new Error("screenshots/ must hold 3 or 4 images, found " + shotFiles + ".");
  }
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  if (dossier.length === 0) throw new Error("buildDossier wrote an empty dossier.");
  const dossierPath = join(OUTPUT_DIR, "dossier.json");
  writeFileSync(dossierPath, dossier);
  console.log("Wrote " + dossierPath + " (" + dossier.length + " bytes) from " + appFiles + " app files and " + shotFiles + " screenshots.");
}

handIn();
