// Build smoke test (tickets 06 & 07): verify the static build produced the
// expected pages and the Pagefind search index. Run after `npm run build`.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const DATA_DIR = join("src", "data", "editions");

// Derive the expected session count from the committed data so the gate adapts
// to re-ingests instead of relying on a hardcoded number.
const EXPECTED_SESSIONS = existsSync(DATA_DIR)
  ? readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .reduce(
        (n, f) =>
          n +
          JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")).sessions.length,
        0,
      )
  : 0;

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
check(
  existsSync(join(DIST, "sessions", "index.html")),
  "all-sessions list built",
);

// Session detail pages live at sessions/<edition>/<id>/index.html; exclude the
// all-sessions listing page (sessions/index.html) from the detail-page count.
const sessionsDir = join(DIST, "sessions");
const sessionDetailPages = existsSync(sessionsDir)
  ? countIndexHtml(sessionsDir) -
    (existsSync(join(sessionsDir, "index.html")) ? 1 : 0)
  : 0;
check(
  sessionDetailPages === EXPECTED_SESSIONS,
  `${EXPECTED_SESSIONS} session pages (got ${sessionDetailPages})`,
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
