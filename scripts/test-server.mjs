// Serve the exact release directory at the root and at a representative nested mount.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root = resolve("dist");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/portable.html") {
      res.setHeader("Content-Type", "text/html");
      res.end(await readFile("KIPLING.html"));
      return;
    }
    const name = decodeURIComponent(url.pathname).replace(
      /^\/exhibits\/kl43(?=\/)/,
      "",
    );
    const file = resolve(
      root,
      "." + name + (name.endsWith("/") ? "index.html" : ""),
    );
    if (!file.startsWith(root + sep)) throw Error();
    const data = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] ?? "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end();
  }
}).listen(5184, "127.0.0.1");
