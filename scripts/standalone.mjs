// Package the hosted build as a portable HTML document using only its local assets.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
const root = resolve("dist");
let html = readFileSync(resolve(root, "index.html"), "utf8");
html = html.replace(
  /<script[^>]+src="([^"]+)"[^>]*><\/script>/g,
  (_, path) =>
    '<script type="module">' +
    readFileSync(resolve(root, path), "utf8").replace(
      /<\/script/gi,
      "<\\/script",
    ) +
    "</script>",
);
html = html.replace(
  /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g,
  (_, path) => {
    const file = resolve(root, path);
    const css = readFileSync(file, "utf8").replace(
      /url\(\.\/([^)]+)\)/g,
      (_, name) =>
        "url(data:font/" +
        name.split(".").pop() +
        ";base64," +
        readFileSync(resolve(dirname(file), name)).toString("base64") +
        ")",
    );
    return "<style>" + css + "</style>";
  },
);
writeFileSync("KIPLING.html", html);
