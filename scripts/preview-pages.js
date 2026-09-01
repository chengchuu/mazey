/* eslint-env node */

const { createReadStream, existsSync, statSync } = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const projectConfig = require("../project.config");

const { basePath } = projectConfig.site;
const docs = path.resolve(__dirname, "..", "docs");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function send(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

function resolveRequest(requestUrl) {
  try {
    const url = new URL(requestUrl, `http://${host}:${port}`);
    if (!url.pathname.startsWith(basePath)) return null;
    const relative = decodeURIComponent(url.pathname.slice(basePath.length));
    const candidate = path.resolve(docs, relative);
    if (candidate !== docs && !candidate.startsWith(`${docs}${path.sep}`))
      return null;
    if (existsSync(candidate) && statSync(candidate).isDirectory()) {
      return path.join(candidate, "index.html");
    }
    return candidate;
  } catch {
    return null;
  }
}

const server = http.createServer((request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
    send(response, 405, "Method not allowed");
    return;
  }
  const file = resolveRequest(request.url);
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    send(response, 404, "Not found");
    return;
  }
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type":
      contentTypes.get(path.extname(file)) ?? "application/octet-stream",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(
    `PWA preview: http://${host}:${port}${basePath}\nPress Ctrl+C to stop.`
  );
});
