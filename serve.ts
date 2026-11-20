// Tiny static file server for the Leonida trophy guide.
// Run it with `node serve.ts`, then open http://localhost:8080 in a browser.
// It only ever reads files from the app/ folder next to this file, so the
// guide works exactly the way it will when it is hosted as plain files.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("app", import.meta.url)));
const port = Number(process.env.PORT ?? 8080);

const mimeBySuffix: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function safePath(requested: string): string | null {
  const cleaned = normalize(decodeURIComponent(requested.split("?")[0]));
  const joined = resolve(join(root, cleaned === "/" ? "index.html" : cleaned));
  return joined === root || joined.startsWith(root + "/") ? joined : null;
}

const server = createServer(async (req, res) => {
  const target = safePath(req.url ?? "/");
  if (target === null) {
    res.writeHead(403, { "content-type": "text/plain" });
    res.end("outside the guide folder");
    return;
  }
  try {
    const body = await readFile(target);
    res.writeHead(200, { "content-type": mimeBySuffix[extname(target)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
});

server.listen(port, () => {
  console.log(`Leonida trophy guide serving at http://localhost:${port}`);
});
