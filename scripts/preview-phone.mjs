import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve("frontend");
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};
http
  .createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const file = path.resolve(
        root,
        "." +
          (url.pathname === "/"
            ? "/phone-preview.html"
            : decodeURIComponent(url.pathname)),
      );
      if (
        !file.startsWith(root + path.sep) ||
        !existsSync(file) ||
        !statSync(file).isFile()
      ) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(readFileSync(file));
    } catch {
      res.writeHead(400);
      res.end("Invalid request");
    }
  })
  .listen(3001, "127.0.0.1", () =>
    console.log(
      "Phone layout preview: http://127.0.0.1:3001/phone-preview.html (static layout preview only)",
    ),
  );
