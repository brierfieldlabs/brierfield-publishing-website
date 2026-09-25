import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve("dist");
const required = [
  "index.html",
  "books.html",
  "authors.html",
  "about.html",
  "services.html",
  "contact.html",
  "privacy.html",
  "404.html",
  "assets/styles.css",
  "assets/site.js",
  "assets/logo-horizontal-transparent.png",
  "robots.txt",
  "sitemap.xml"
];

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

for (const rel of required) {
  if (!(await exists(join(root, rel)))) {
    throw new Error("Missing required output: " + rel);
  }
}
const htmlFiles = (await readdir(root)).filter(name => name.endsWith(".html"));
const broken = [];

for (const name of htmlFiles) {
  const file = join(root, name);
  const html = await readFile(file, "utf8");

  if (!html.includes('name="viewport"')) {
    throw new Error(name + " is missing the viewport meta tag");
  }
  if (html.includes("127.0.0.1") || html.includes("localhost") || html.includes('href="#"')) {
    throw new Error(name + " contains a development-only or placeholder link");
  }
  if (html.includes("{{")) {
    throw new Error(name + " contains an unreplaced template marker");
  }

  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|#)/.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    const target = resolve(dirname(file), clean);
    if (!target.startsWith(root) || !(await exists(target))) {
      broken.push(name + " -> " + ref);
    }
  }
}
if (broken.length) {
  throw new Error("Broken local references:\n" + broken.join("\n"));
}

const home = await readFile(join(root, "index.html"), "utf8");
if (!home.includes("data-menu-toggle") || !home.includes("assets/site.js")) {
  throw new Error("Responsive navigation JavaScript is not wired into the site");
}

console.log("Validated " + htmlFiles.length + " HTML pages and local assets.");