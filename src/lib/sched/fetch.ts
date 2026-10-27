// Thin, injectable network layer over public Sched pages.
//
// Kept deliberately small so the normalizer (parse.ts) can be driven from saved
// HTML with no network. Polite by construction: an explicit User-Agent and a
// rate limit comfortably under Sched's 30 requests/minute.

export type Fetcher = (url: string) => Promise<string>;

export const USER_AGENT =
  "MMSContentArchive/0.1 (+https://github.com/KenGoossens/mms-content-archive)";

/** Minimum gap between requests: 30/min would be 2000ms; 2200ms leaves headroom. */
const MIN_INTERVAL_MS = 2200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A rate-limited HTTP fetcher. Serializes calls and spaces them by at least
 * MIN_INTERVAL_MS so a bulk per-session crawl stays within Sched's limits.
 */
export function createRateLimitedFetcher(
  minIntervalMs = MIN_INTERVAL_MS,
): Fetcher {
  let last = 0;
  let chain: Promise<unknown> = Promise.resolve();

  return (url: string): Promise<string> => {
    const run = async (): Promise<string> => {
      const wait = last + minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok)
        throw new Error(`Fetch ${url} failed: ${res.status} ${res.statusText}`);
      return res.text();
    };
    // Serialize so the rate limit holds even under concurrent callers.
    const next = chain.then(run, run);
    chain = next.catch(() => undefined);
    return next;
  };
}

export const listDescriptionsUrl = (subdomain: string) =>
  `https://${subdomain}/list/descriptions`;
export const eventUrl = (subdomain: string, key: string) =>
  `https://${subdomain}/event/${key}`;
