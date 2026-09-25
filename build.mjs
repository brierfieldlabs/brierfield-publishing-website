import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const src = new URL("./src/", root);
const out = new URL("./dist/", root);

const site = JSON.parse(await readFile(new URL("site.json", src), "utf8"));
const books = JSON.parse(await readFile(new URL("books.json", src), "utf8"));
const layout = await readFile(new URL("layout.html", src), "utf8");

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bookCard(book, compact = false) {
  const coverClass = compact ? "cover-art cover-art-small" : "cover-art";
  const cover = book.image
    ? '<div class="' + coverClass + '"><img src="' + esc(book.image) + '" alt="Cover of ' + esc(book.title) + '" loading="lazy"></div>'
    : '<div class="' + coverClass + ' cover-placeholder" aria-label="' + esc(book.title) + ' cover not currently shown"><span>' + esc(book.title) + '</span></div>';
  const description = compact ? "" : '<p class="book-description">' + esc(book.description) + '</p>';
  return '<article class="book-card' + (compact ? ' book-card-compact' : '') + '">' +
    cover +
    '<div class="book-copy">' +
    '<p class="book-category">' + esc(book.category) + '</p>' +
    '<h3>' + esc(book.title) + '</h3>' +
    '<p class="book-meta">' + esc(book.author) + ' · ' + esc(book.meta) + '</p>' +
    description +
    '</div></article>';
}

const featuredSlugs = [
  "the-last-photograph",
  "the-parish-council-has-questions",
  "the-windermere-fellowship",
  "noodle-and-me"
];

const featured = featuredSlugs.map(slug => books.find(book => book.slug === slug));
const featuredHtml = featured.map(book => bookCard(book, true)).join("\n");
const allBooksHtml = books.map(book => bookCard(book, false)).join("\n");

await rm(out, { recursive: true, force: true });
await mkdir(new URL("./assets/", out), { recursive: true });
await cp(new URL("./assets/", root), new URL("./assets/", out), { recursive: true });
await cp(new URL("styles.css", src), new URL("./assets/styles.css", out));
await cp(new URL("site.js", src), new URL("./assets/site.js", out));

for (const page of site.pages) {
  let content = await readFile(new URL("pages/" + page.content, src), "utf8");
  content = content
    .replaceAll("{{FEATURED_BOOKS}}", featuredHtml)
    .replaceAll("{{ALL_BOOKS}}", allBooksHtml);

  const canonicalPath = page.file === "index.html" ? "" : page.file;
  const activeAttr = name => page.active === name ? 'aria-current="page"' : "";

  const html = layout
    .replaceAll("{{TITLE}}", esc(page.title))
    .replaceAll("{{DESCRIPTION}}", esc(page.description))
    .replaceAll("{{CANONICAL}}", site.domain + "/" + canonicalPath)
    .replaceAll("{{NAV_BOOKS}}", activeAttr("books"))
    .replaceAll("{{NAV_AUTHORS}}", activeAttr("authors"))
    .replaceAll("{{NAV_ABOUT}}", activeAttr("about"))
    .replaceAll("{{NAV_SERVICES}}", activeAttr("services"))
    .replaceAll("{{NAV_CONTACT}}", activeAttr("contact"))
    .replaceAll("{{CONTENT}}", content);

  await writeFile(new URL(page.file, out), html);
}

const sitemapFiles = site.pages
  .map(page => page.file)
  .filter(file => file !== "404.html");
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemapFiles.map(file => '  <url><loc>' + site.domain + '/' + (file === "index.html" ? "" : file) + '</loc></url>').join("\n") +
  '\n</urlset>\n';

await writeFile(new URL("./sitemap.xml", out), sitemap);
await writeFile(new URL("./robots.txt", out), "User-agent: *\nAllow: /\nSitemap: " + site.domain + "/sitemap.xml\n");
await writeFile(new URL("./.nojekyll", out), "");
console.log("Built " + site.pages.length + " HTML pages into dist/");