import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildStatic, output, root } from "../scripts/build-static.mjs";

test("deployment contains only public pages, assets, scripts and discovery files", async () => {
  await buildStatic();
  const names = await readdir(output);
  assert.equal(names.filter((name) => name.endsWith(".html")).length, 8);
  for (const name of names) {
    assert.ok(name.endsWith(".html") || ["assets", "css", "js", "data", "robots.txt", "sitemap.xml"].includes(name), name);
  }
  for (const secretOrSource of [".env.local", ".git", "sites", ".agents", "package.json", "dist"]) {
    assert.ok(!names.includes(secretOrSource));
  }
  assert.equal(await readFile(path.join(output, "index.html"), "utf8"), await readFile(path.join(root, "index.html"), "utf8"));
  const config = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
  assert.equal(config.outputDirectory, "public-static");
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.match(headers["Content-Security-Policy"], /script-src 'self';/);
  assert.match(headers["Content-Security-Policy"], /form-action 'none'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
});
