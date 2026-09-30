import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { buildStatic, output, root } from "./build-static.mjs";

await buildStatic();
const config = JSON.parse(await readFile(path.join(root, "vercel.json"), "utf8"));
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };
const server = createServer(async (request, response) => {
  for (const { key, value } of config.headers.find((entry) => entry.source === "/(.*)").headers) {
    response.setHeader(key, value);
  }
  response.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  try {
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname === "/favicon.ico") pathname = "/assets/nav-logo.png";
    if (pathname.endsWith("/")) pathname += "index.html";
    const filename = path.resolve(output, `.${pathname}`);
    if (!filename.startsWith(`${output}${path.sep}`) || pathname.split("/").some((part) => part.startsWith("."))) {
      response.writeHead(404).end("Not found");
      return;
    }
    if (!(await stat(filename)).isFile()) throw new Error("Not a file");
    let body = await readFile(filename);
    const contentType = mime[path.extname(filename)] ?? "application/octet-stream";
    // Match production text compression when benchmarking the local preview.
    const acceptsGzip = (request.headers["accept-encoding"] || "").split(",").some(entry => {
      const [encoding, ...parameters] = entry.trim().split(";");
      const quality = parameters.find(parameter => parameter.trim().startsWith("q="));
      return encoding === "gzip" && (!quality || Number(quality.trim().slice(2)) > 0);
    });
    if (/^(text\/|application\/(json|javascript|xml)|image\/svg\+xml)/.test(contentType)) {
      response.setHeader("Vary", "Accept-Encoding");
      if (acceptsGzip) {
        body = gzipSync(body);
        response.setHeader("Content-Encoding", "gzip");
      }
    }
    response.writeHead(200, { "Content-Type": contentType, "Content-Length": body.length });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
});
const portFlag = process.argv.indexOf("--port");
const port = Number(portFlag >= 0 ? process.argv[portFlag + 1] : process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Use a port between 1 and 65535.");
server.on("error", (error) => {
  console.error(`Could not start static preview: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`Static preview: http://127.0.0.1:${port} (run again after edits)`));
