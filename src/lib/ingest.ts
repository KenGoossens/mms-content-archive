// Ingest orchestrator (ADR-0001): fetch -> parse/normalize -> (summarize: deferred)
// -> write JSON. Idempotent: re-running an edition overwrites its file cleanly.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EditionData, EditionMeta } from "./types";
import { parseEdition, parseSessionAbstract } from "./sched/parse";
import { UNCATEGORIZED } from "./taxonomy";
import { eventUrl, listDescriptionsUrl, type Fetcher } from "./sched/fetch";

const HERE = dirname(fileURLToPath(import.meta.url));
/** Committed normalized data lives at src/data/editions/<id>.json. */
export const DATA_DIR = join(HERE, "..", "data", "editions");

export interface IngestOptions {
  /** When true, fetch each session's detail page to upgrade truncated abstracts. */
  fullAbstracts?: boolean;
  /** Optional progress hook. */
  onProgress?: (msg: string) => void;
}

/** Fetch and normalize one edition. Pure except for the injected `fetcher`. */
export async function ingestEdition(
  meta: EditionMeta,
  fetcher: Fetcher,
  options: IngestOptions = {},
): Promise<EditionData> {
  const log = options.onProgress ?? (() => {});
  log(`Fetching ${meta.name} (${meta.subdomain})`);
  const html = await fetcher(listDescriptionsUrl(meta.subdomain));
  const data = parseEdition(html, meta);
  log(
    `  parsed ${data.sessions.length} sessions, ${data.speakers.length} speakers`,
  );

  // Surface Source Tracks that fell through to Uncategorized so the taxonomy
  // mapping can be extended (ADR-0003) rather than silently losing them.
  const unmapped = new Map<string, number>();
  for (const s of data.sessions) {
    if (s.sourceTrack && s.category === UNCATEGORIZED) {
      unmapped.set(s.sourceTrack, (unmapped.get(s.sourceTrack) ?? 0) + 1);
    }
  }
  if (unmapped.size > 0) {
    const list = [...unmapped.entries()]
      .map(([t, n]) => `${t} (${n})`)
      .join(", ");
    log(`  ⚠ unmapped Source Tracks -> add to taxonomy: ${list}`);
  }

  if (options.fullAbstracts) {
    for (const session of data.sessions) {
      try {
        const detail = await fetcher(eventUrl(meta.subdomain, session.id));
        const full = parseSessionAbstract(detail);
        if (full) {
          session.abstract = full;
          session.abstractFull = true;
        }
      } catch (err) {
        log(
          `  abstract upgrade failed for ${session.id}: ${(err as Error).message}`,
        );
      }
    }
    log(`  upgraded abstracts`);
  }

  return data;
}

/** Write one edition's normalized data to its JSON file (creating the dir). */
export async function writeEditionData(data: EditionData): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const path = join(DATA_DIR, `${data.edition.id}.json`);
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  return path;
}
