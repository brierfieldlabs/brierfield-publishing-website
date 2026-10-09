import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertStagingBranch, validateFeed } from "./hub-release-feed.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const input = process.argv[2];

if (!input) {
  throw new Error(
    "Usage: node scripts/sync-hub-release-feed.mjs <hub-staging-handoff.json>"
  );
}

const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: root,
  encoding: "utf8"
}).trim();
assertStagingBranch(branch);

const sourcePath = resolve(process.cwd(), input);
const payload = await readFile(sourcePath);
let feed;
try {
  feed = JSON.parse(payload.toString("utf8"));
} catch (error) {
  throw new Error("Hub staging handoff is not valid JSON: " + error.message);
}
validateFeed(feed);

const output = resolve(root, "src", "hub-release-feed.json");
await writeFile(output, payload);

const digest = createHash("sha256").update(payload).digest("hex");
console.log(
  "Synced Hub release feed to staging: " +
    feed.record_count +
    " record(s), SHA-256 " +
    digest
);
