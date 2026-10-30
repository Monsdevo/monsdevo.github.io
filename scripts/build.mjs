import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderInfamousPage } from "./render-infamous.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await renderInfamousPage();
const dist = resolve(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "client"), { recursive: true });
await mkdir(resolve(dist, "server"), { recursive: true });
for (const file of ["index.html", "style.css", "page.js"]) await cp(resolve(root, file), resolve(dist, "client", file));
await cp(resolve(root, "assets/mons-games-mark.png"), resolve(dist, "client/assets/mons-games-mark.png"));
for (const directory of ["fonts", "infamous2-ios"]) {
  const source = resolve(root, "assets", directory);
  const target = resolve(dist, "client/assets", directory);
  await mkdir(target, { recursive: true });
  for (const file of await readdir(source)) if (/\.(?:webp|png|woff2|ttf|txt)$/i.test(file)) await cp(resolve(source, file), resolve(target, file));
}
await cp(resolve(root, "scripts/worker.mjs"), resolve(dist, "server/index.js"));
console.log("inFAMOUS 2 iOS production build is ready.");
