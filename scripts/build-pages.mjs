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

for (const name of ["sitemap.xml", "robots.txt"]) {
  try { await unlink(join(stagingOut, name)); } catch {}
}

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

  if (!/<meta\s+name="robots"/i.test(html)) {
    html = html.replace("</head>",
      '  <meta name="robots" content="noindex,nofollow">\n' + stagingStyle + "\n</head>");
  }
  if (!html.includes("STAGING SITE · Changes here are not live")) {
    html = html.replace(/<body([^>]*)>/i, "<body$1>\n  " + banner);
  }
  await writeFile(file, html);
}

console.log("Built live site at " + output);
console.log("Built protected staging site at " + stagingOut);