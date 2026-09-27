import { cp, mkdir, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative, resolve, sep } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, item, index, all) => {
    if (item.startsWith("--")) pairs.push([item.slice(2), all[index + 1]]);
    return pairs;
  }, [])
);

for (const name of ["live", "staging", "output"]) {
  if (!args[name]) throw new Error("Missing --" + name);
}

const live = resolve(args.live);
const staging = resolve(args.staging);
const output = resolve(args.output);

function runNode(root, script) {
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error("Failed in " + root + ": " + script);
}

async function walk(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

runNode(live, "build.mjs");
runNode(live, "scripts/validate-site.mjs");
runNode(staging, "build.mjs");
runNode(staging, "scripts/validate-site.mjs");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(live, "dist"), output, { recursive: true });

const stagingOut = join(output, "staging");
await mkdir(stagingOut, { recursive: true });
await cp(join(staging, "dist"), stagingOut, { recursive: true });

try { await unlink(join(stagingOut, "sitemap.xml")); } catch {}
await writeFile(join(stagingOut, "robots.txt"), "User-agent: *\nDisallow: /\n");

const banner = '<div class="staging-banner" role="status">STAGING SITE · Changes here are not live</div>';
const stagingStyle = `<style>
.staging-banner{position:sticky;top:0;z-index:99999;padding:9px 14px;background:#7a253d;color:#fff;text-align:center;font:700 clamp(.76rem,2.8vw,.88rem)/1.25 system-ui,sans-serif;letter-spacing:.035em}
</style>`;
for (const file of (await walk(stagingOut)).filter(path => path.endsWith(".html"))) {
  let html = await readFile(file, "utf8");
  const rel = relative(stagingOut, file).split(sep).join("/");
  const canonicalPath = rel === "index.html" ? "" : rel;
  const canonical = "https://brierfieldpublishing.co.uk/staging/" + canonicalPath;

  html = html.replace(/<link rel="canonical" href="[^"]*">/i,
    '<link rel="canonical" href="' + canonical + '">');
  html = html.replace(/<meta property="og:url" content="[^"]*">/i,
    '<meta property="og:url" content="' + canonical + '">');

  if (/<meta\s+name="robots"/i.test(html)) {
    html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*>/i,
      '<meta name="robots" content="noindex,nofollow">');
  } else {
    html = html.replace("</head>",
      '  <meta name="robots" content="noindex,nofollow">\n</head>');
  }
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, "");
  if (!html.includes(".staging-banner{")) {
    html = html.replace("</head>", stagingStyle + "\n</head>");
  }
  if (!html.includes("STAGING SITE · Changes here are not live")) {
    html = html.replace(/<body([^>]*)>/i, "<body$1>\n  " + banner);
  }
  if (!html.includes('name="robots" content="noindex,nofollow"')) {
    throw new Error(rel + ": staging copy must be noindex,nofollow");
  }
  if (!html.includes('rel="canonical" href="' + canonical + '"')) {
    throw new Error(rel + ": staging canonical URL is incorrect");
  }
  await writeFile(file, html);
}

const stagingRobots = await readFile(join(stagingOut, "robots.txt"), "utf8");
if (!stagingRobots.includes("Disallow: /")) {
  throw new Error("staging robots.txt must block crawling");
}
try {
  await readFile(join(stagingOut, "sitemap.xml"), "utf8");
  throw new Error("staging sitemap.xml must not be deployed");
} catch (error) {
  if (error.message === "staging sitemap.xml must not be deployed") throw error;
}

console.log("Built live site at " + output);
console.log("Built protected staging site at " + stagingOut);
