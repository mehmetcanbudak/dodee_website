/** Repeatable mobile Lighthouse lab measurements; never a substitute for field metrics. */
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = new URL(process.argv[2] || "http://127.0.0.1:8080");
assert.ok(["http:", "https:"].includes(origin.protocol), "Use an HTTP(S) site URL");
const scope = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname) ? "local-lab" : "deployed-lab";
const paths = (process.env.QA_PERF_ROUTES || "/").split(",");
const includeMedia = process.env.QA_PERF_INCLUDE_MEDIA === "1";
const runs = Number(process.env.QA_PERF_RUNS || 3);
assert.ok(Number.isInteger(runs) && runs >= 1 && runs <= 5, "Use 1–5 performance runs");
const output = resolve(root, process.env.QA_PERF_OUTPUT || `test-results/performance/${scope}`);
const budget = JSON.parse(await readFile(resolve(root, "performance-budget.json"), "utf8"));
await mkdir(output, { recursive: true });
const results = { scope, origin: origin.href, checkedAt: new Date().toISOString(), runs, methodology: "Lighthouse mobile defaults with simulated Slow 4G and CPU throttling; median of repeated cold navigations. Local HTTP does not measure hosting/CDN/TLS/field performance.", transport: process.env.QA_PERF_TRANSPORT || "Direct origin response; no transport proxy.", thirdPartyExclusions: includeMedia ? [] : ["YouTube embeds and resources"], includeMedia, budget, pages: [] };
let failed = false;
const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length/2)];

try {
  for (const path of paths) {
    const measurements = [];
    for (let index = 0; index < runs; index += 1) {
      const probe = createServer();
      probe.listen(0, "127.0.0.1");
      await once(probe, "listening");
      const { port } = probe.address();
      await new Promise((done, reject) => probe.close(error => error ? reject(error) : done()));
      const browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${port}`, ...(includeMedia ? [] : ["--host-resolver-rules=MAP www.youtube.com ~NOTFOUND,MAP www.youtube-nocookie.com ~NOTFOUND"])] });
      try {
        const result = await lighthouse(new URL(path, origin).href, {
          port,
          output: ["html", "json"],
          logLevel: "error",
          onlyCategories: ["performance"],
          formFactor: "mobile",
          throttlingMethod: "simulate",
          blockedUrlPatterns: includeMedia ? [] : ["*youtube.com/*", "*youtube-nocookie.com/*"],
          maxWaitForLoad: 35_000,
        });
        assert.ok(result?.lhr && !result.lhr.runtimeError, result?.lhr.runtimeError?.message || "Missing Lighthouse result");
        const { lhr } = result;
        const name = `${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}-${index+1}`;
        await writeFile(resolve(output, `${name}.html`), result.report[0]);
        await writeFile(resolve(output, `${name}.json`), result.report[1]);
        const measurement = {
          score: Math.round(lhr.categories.performance.score * 100),
          fcpMs: lhr.audits["first-contentful-paint"].numericValue,
          lcpMs: lhr.audits["largest-contentful-paint"].numericValue,
          tbtMs: lhr.audits["total-blocking-time"].numericValue,
          cls: lhr.audits["cumulative-layout-shift"].numericValue,
          transferBytes: lhr.audits["total-byte-weight"].numericValue,
          youtubeTransferBytes: (lhr.audits["network-requests"].details?.items || [])
            .filter(request => /(?:^|\.)youtube(?:-nocookie)?\.com$/.test(new URL(request.url).hostname))
            .reduce((total, request) => total + (request.transferSize || 0), 0),
        };
        measurements.push(measurement);
        console.log(`${scope} ${path} run ${index+1}: score=${measurement.score} LCP=${Math.round(measurement.lcpMs)}ms TBT=${Math.round(measurement.tbtMs)}ms CLS=${measurement.cls.toFixed(3)}`);
      } finally {
        await browser.close();
      }
    }
    const medians = Object.fromEntries(Object.keys(measurements[0]).map(key => [key, median(measurements.map(run => run[key]))]));
    const failures = [];
    if (medians.score < budget.minScore) failures.push(`score ${medians.score} < ${budget.minScore}`);
    for (const metric of ["lcpMs", "tbtMs", "cls", "transferBytes"]) {
      if (medians[metric] > budget[metric]) failures.push(`${metric} ${medians[metric]} > ${budget[metric]}`);
    }
    failed ||= failures.length > 0;
    results.pages.push({ path, measurements, medians, failures });
  }
} finally {
  await writeFile(resolve(output, "summary.json"), JSON.stringify(results, null, 2) + "\n");
}
if (failed) {
  console.error("Performance budget exceeded; inspect the saved Lighthouse reports.");
  process.exitCode = 1;
}
