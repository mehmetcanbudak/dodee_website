import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const output = path.join(root, "public-static");

// Only this generated directory is replaced. The old dist/ and nested React
// repository are separate artifacts and must never become public by accident.
export async function buildStatic() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const pages = (await readdir(root)).filter((name) => name.endsWith(".html"));
  for (const name of [...pages, "robots.txt", "sitemap.xml", "assets", "css", "js", "data"]) {
    await cp(path.join(root, name), path.join(output, name), {
      recursive: true,
      filter: (source) => !path.basename(source).startsWith("."),
    });
  }
  return pages.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await buildStatic();
  console.log(`Built ${count} pages into public-static/ (public files only).`);
}
