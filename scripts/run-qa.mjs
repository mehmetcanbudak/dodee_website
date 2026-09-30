import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2] || "browser";
const tasks = { browser: "scripts/check-static-browser.mjs", performance: "scripts/performance.mjs" };
if (!tasks[mode]) throw new Error(`Unknown QA mode: ${mode}`);
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const { port } = probe.address();
await new Promise((done, reject) => probe.close(error => error ? reject(error) : done()));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve-static.mjs", "--port", String(port)], { cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: "false" }, stdio: ["ignore", "pipe", "pipe"] });
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) stream.on("data", chunk => { serverOutput = `${serverOutput}${chunk}`.slice(-100_000); });
let runner;
const stop = () => { runner?.kill("SIGTERM"); server.kill("SIGTERM"); };
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Preview exited before becoming ready:\n${serverOutput}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1500) });
      await response.body?.cancel();
      if (response.status === 200) { ready = true; break; }
    } catch { /* Wait until the local listener is ready. */ }
    await delay(250);
  }
  if (!ready) throw new Error(`Preview did not become ready:\n${serverOutput}`);
  runner = spawn(process.execPath, [tasks[mode], origin], { cwd: root, stdio: "inherit", env: { ...process.env, SITE_URL: origin, QA_PERF_ROUTES: process.env.QA_PERF_ROUTES || "/,/for-parents.html" } });
  const [code, signal] = await once(runner, "exit");
  if (code !== 0) throw new Error(`${mode} QA failed (${signal || code})`);
} finally {
  if (server.exitCode === null) {
    const exited = once(server, "exit");
    server.kill("SIGTERM");
    const forced = setTimeout(() => server.kill("SIGKILL"), 5000);
    forced.unref();
    await exited;
    clearTimeout(forced);
  }
  await mkdir(resolve(root, "test-results"), { recursive: true });
  await writeFile(resolve(root, "test-results", `${mode}-server.log`), serverOutput);
  process.removeListener("SIGINT", stop);
  process.removeListener("SIGTERM", stop);
}
