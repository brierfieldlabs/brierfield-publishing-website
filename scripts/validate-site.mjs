import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve("dist");
const domain = "https://brierfieldpublishing.co.uk";
const socialImage = domain + "/assets/logo-horizontal-transparent.png";
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
  "assets/logo-horizontal-gold.png",
  "robots.txt",
  "sitemap.xml"
];

async function exists(path) {
  try { return (await stat(path)).isFile(); }
  catch { return false; }
}

function between(text, before, after) {
  const start = text.indexOf(before);
  if (start < 0) return "";
  const valueStart = start + before.length;
  const end = text.indexOf(after, valueStart);
  return end < 0 ? "" : text.slice(valueStart, end);
}

function metaName(html, name) {
  return between(html, '<meta name="' + name + '" content="', '">');
}

function metaProperty(html, property) {
  return between(html, '<meta property="' + property + '" content="', '">');
}

function canonicalFor(html) {
  return between(html, '<link rel="canonical" href="', '">');
}

function titleFor(html) {
  return between(html, "<title>", "</title>").trim();
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

  const canonical = domain + "/" + (name === "index.html" ? "" : name);
  if (canonicalFor(html) !== canonical) {
    throw new Error(name + " has an incorrect canonical URL");
  }

  const robots = metaName(html, "robots").toLowerCase().replaceAll(" ", "");
  if (name === "404.html") {
    if (robots !== "noindex,follow") throw new Error("404.html must be noindex,follow");
  } else {
    if (robots !== "index,follow") {
      throw new Error(name + " must explicitly be index,follow");
    }

    const title = titleFor(html);
    const description = metaName(html, "description");
    const expectedProperties = {
      "og:type": "website",
      "og:locale": "en_GB",
      "og:site_name": "Brierfield Publishing",
      "og:title": title,
      "og:description": description,
      "og:url": canonical,
      "og:image": socialImage,
      "og:image:alt": "Brierfield Publishing logo",
      "og:image:width": "2172",
      "og:image:height": "724"
    };
    for (const [key, value] of Object.entries(expectedProperties)) {
      if (metaProperty(html, key) !== value) {
        throw new Error(name + ": " + key + " metadata is incorrect");
      }
    }

    const expectedNames = {
      "twitter:card": "summary",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": socialImage,
      "twitter:image:alt": "Brierfield Publishing logo"
    };
    for (const [key, value] of Object.entries(expectedNames)) {
      if (metaName(html, key) !== value) {
        throw new Error(name + ": " + key + " metadata is incorrect");
      }
    }
  }

  if (!html.includes('rel="icon" type="image/png" href="assets/logo-horizontal-transparent.png"')) {
    throw new Error(name + " is missing the Brierfield favicon metadata");
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

const jsonStart = '<script type="application/ld+json">';
const jsonText = between(home, jsonStart, "</script>").trim();
if (!jsonText) throw new Error("index.html is missing Organization JSON-LD");
const organization = JSON.parse(jsonText);
const expectedOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": domain + "/#organization",
  name: "Brierfield Publishing",
  url: domain + "/",
  logo: socialImage,
  email: "contact@brierfieldpublishing.co.uk",
  slogan: "Good books. A calmer world."
};
for (const [key, value] of Object.entries(expectedOrganization)) {
  if (organization[key] !== value) {
    throw new Error("index.html JSON-LD " + key + " is incorrect");
  }
}
if (!organization.description) {
  throw new Error("index.html JSON-LD needs an organization description");
}

const robots = await readFile(join(root, "robots.txt"), "utf8");
if (!robots.includes("Allow: /") || robots.includes("Disallow: /")) {
  throw new Error("production robots.txt must allow crawling");
}
if (!robots.includes("Sitemap: " + domain + "/sitemap.xml")) {
  throw new Error("production robots.txt must advertise the sitemap");
}

const sitemap = await readFile(join(root, "sitemap.xml"), "utf8");
const urls = sitemap.split("<loc>").slice(1)
  .map(chunk => chunk.split("</loc>")[0])
  .sort();
const expectedUrls = htmlFiles
  .filter(name => name !== "404.html")
  .map(name => domain + "/" + (name === "index.html" ? "" : name))
  .sort();
if (JSON.stringify(urls) !== JSON.stringify(expectedUrls)) {
  throw new Error("sitemap.xml must list exactly the public HTML pages");
}

console.log(
  "Validated " + htmlFiles.length +
  " HTML pages, local assets and search metadata."
);
