// Ingest CLI: `npm run ingest [-- <editionId...>] [--full] [--fixtures]`
//
//   npm run ingest                      ingest every edition (live)
//   npm run ingest -- mms-2026-midway   ingest one edition (live)
//   npm run ingest -- --full            also fetch detail pages for full abstracts
//   npm run ingest -- --fixtures        parse bundled test fixtures instead of the
//                                       network (offline/reproducible seeding)
//
// Writes src/data/editions/<id>.json. Idempotent.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EDITIONS, editionById } from "../src/lib/editions";
import { ingestEdition, writeEditionData } from "../src/lib/ingest";
import { createRateLimitedFetcher, type Fetcher } from "../src/lib/sched/fetch";

const HERE = dirname(fileURLToPath(import.meta.url));

// Offline fetcher: resolve each edition's /list/descriptions to a saved fixture.
const FIXTURES: Record<string, string> = {
  "mms-2026-midway": "midway_descriptions.html",
  "mms-2024-flamingo": "fll2024_descriptions.html",
};
function fixtureFetcher(): Fetcher {
  return async (url: string) => {
    const edition = EDITIONS.find((e) => url.includes(e.subdomain));
    const file = edition && FIXTURES[edition.id];
    if (!file) throw new Error(`No fixture for ${url}`);
    return readFile(join(HERE, "..", "test", "fixtures", file), "utf8");
  };
}

async function main() {
  const args = process.argv.slice(2);
  const full = args.includes("--full");
  const useFixtures = args.includes("--fixtures");
  const ids = args.filter((a) => !a.startsWith("--"));

  const targets = ids.length
    ? ids.map((id) => {
        const m = editionById(id);
        if (!m) throw new Error(`Unknown edition: ${id}`);
        return m;
      })
    : EDITIONS;

  const fetcher = useFixtures ? fixtureFetcher() : createRateLimitedFetcher();

  for (const meta of targets) {
    const data = await ingestEdition(meta, fetcher, {
      fullAbstracts: full,
      onProgress: console.log,
    });
    const path = await writeEditionData(data);
    console.log(`wrote ${path} (${data.sessions.length} sessions)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
