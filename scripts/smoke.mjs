// Build smoke test (tickets 06 & 07): verify the static build produced the
// expected pages and the Pagefind search index. Run after `npm run build`.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const EXPECTED_SESSIONS = 757;

let failed = false;
function check(ok, msg) {
  console.log(`${ok ? "ok  " : "FAIL"}  ${msg}`);
  if (!ok) failed = true;
}

function countIndexHtml(dir) {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countIndexHtml(p);
    else if (entry.name === "index.html") n++;
  }
  return n;
}

check(existsSync(join(DIST, "index.html")), "home page built");
check(existsSync(join(DIST, "search", "index.html")), "search page built");
check(existsSync(join(DIST, "editions", "index.html")), "editions index built");
check(
  existsSync(join(DIST, "categories", "index.html")),
  "categories index built",
);
check(
  existsSync(join(DIST, "pagefind", "pagefind.js")),
  "pagefind search index built",
);

const sessions = existsSync(join(DIST, "sessions"))
  ? countIndexHtml(join(DIST, "sessions"))
  : 0;
check(
  sessions === EXPECTED_SESSIONS,
  `${EXPECTED_SESSIONS} session pages (got ${sessions})`,
);

const speakers = existsSync(join(DIST, "speakers"))
  ? countIndexHtml(join(DIST, "speakers"))
  : 0;
check(speakers > 0, `speaker pages built (got ${speakers})`);

if (failed) {
  console.error("\nSMOKE FAILED");
  process.exit(1);
}
console.log("\nSMOKE OK");
