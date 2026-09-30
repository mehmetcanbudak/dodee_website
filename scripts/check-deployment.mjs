/** Read-only checks against the selected public static deployment. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const origin = new URL(process.argv[2] || "https://dodee-website.vercel.app");
assert.equal(origin.protocol, "https:", "A public HTTPS origin is required");
assert.equal(origin.pathname, "/", "Pass an origin without a path");
assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash);
const expectedOrigin = new URL(process.env.CANONICAL_ORIGIN || origin.href).origin;
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const headers = config.headers.find(entry => entry.source === "/(.*)").headers;
const results = { origin: origin.origin, expectedOrigin, checkedAt: new Date().toISOString(), checks: [] };

async function check(path, task) {
  try {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20_000) });
    await task(response);
    results.checks.push({ path, status: "passed", httpStatus: response.status });
    console.log(`PASS ${path}`);
  } catch (error) {
    results.checks.push({ path, status: "failed", error: error.message });
    console.error(`FAIL ${path}: ${error.message}`);
  }
}

for (const path of ["/", "/about.html", "/videos.html", "/for-parents.html", "/contact.html", "/sponsors.html", "/press.html", "/privacy.html"]) {
  await check(path, async response => {
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/html/);
    for (const { key, value } of headers) assert.equal(response.headers.get(key), value, `${key} differs from checked-in policy`);
    assert.ok(response.headers.get("strict-transport-security"), "HTTPS response needs HSTS");
    const html = await response.text();
    assert.match(html, /<h1[\s>]/i);
    assert.match(html, /<main[\s>]/i);
    const canonical = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1];
    assert.ok(canonical, "Missing canonical URL");
    assert.equal(new URL(canonical).origin, expectedOrigin);
    assert.doesNotMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i);
  });
}

for (const path of ["/.env.local", "/.git/config", "/sites/dodee-next/package.json", "/package.json", "/dodee-calm-wonder.tar.gz", "/does-not-exist-audit"]) {
  await check(path, async response => assert.equal(response.status, 404, "Private/missing path must not be served"));
}
await check("/robots.txt", async response => {
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(body.includes(`${expectedOrigin}/sitemap.xml`));
  assert.doesNotMatch(body, /^Disallow:\s*\/\s*$/m);
});
await check("/sitemap.xml", async response => {
  assert.equal(response.status, 200);
  const locations = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(locations.length, 8);
  assert.equal(new Set(locations).size, 8);
  for (const location of locations) assert.equal(new URL(location).origin, expectedOrigin);
});
for (const path of ["/css/styles.css", "/js/main.js", "/assets/nav-logo.png", "/favicon.ico"]) {
  await check(path, async response => {
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  });
}
await check("/assets/fonts/nunito-latin-v32.woff2", async response => {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /font\/woff2/);
  assert.match(response.headers.get("cache-control") || "", /max-age=31536000/);
  assert.match(response.headers.get("cache-control") || "", /immutable/);
  assert.ok((await response.arrayBuffer()).byteLength > 0);
});

const output = resolve(process.env.DEPLOY_RESULTS || "test-results/deployment");
await mkdir(output, { recursive: true });
const filename = resolve(output, `${origin.hostname}-${Date.now()}.json`);
await writeFile(filename, JSON.stringify(results, null, 2));
console.log(`Saved ${results.checks.length} checks to ${filename}`);
if (results.checks.some(check => check.status === "failed")) process.exitCode = 1;
