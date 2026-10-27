// Build-time data access for Astro pages. Loads every committed edition JSON via
// Vite's import.meta.glob (eager), so pages never touch the filesystem or network.
// Only imported from .astro pages — tests import the pipeline modules directly.

import type { EditionData, EditionMeta, Session, Speaker } from "./types";

const modules = import.meta.glob<EditionData>("../data/editions/*.json", {
  eager: true,
  import: "default",
});

export interface SessionView {
  session: Session;
  edition: EditionMeta;
}

/** All loaded editions, most recent first. */
export function getAllEditionData(): EditionData[] {
  return Object.values(modules).sort((a, b) =>
    b.edition.startDate.localeCompare(a.edition.startDate),
  );
}

export function getEditions(): EditionMeta[] {
  return getAllEditionData().map((d) => d.edition);
}

/** Every session across every edition, newest edition first, then by start time. */
export function getAllSessions(): SessionView[] {
  const out: SessionView[] = [];
  for (const data of getAllEditionData()) {
    for (const session of data.sessions)
      out.push({ session, edition: data.edition });
  }
  return out.sort((a, b) => {
    const ed = b.edition.startDate.localeCompare(a.edition.startDate);
    if (ed !== 0) return ed;
    return (a.session.start ?? "").localeCompare(b.session.start ?? "");
  });
}

export function getSession(
  editionId: string,
  id: string,
): SessionView | undefined {
  const data = getAllEditionData().find((d) => d.edition.id === editionId);
  const session = data?.sessions.find((s) => s.id === id);
  return data && session ? { session, edition: data.edition } : undefined;
}

/** Resolve a speaker slug within a specific edition. */
export function getSpeaker(
  editionId: string,
  slug: string,
): Speaker | undefined {
  const data = getAllEditionData().find((d) => d.edition.id === editionId);
  return data?.speakers.find((s) => s.slug === slug);
}

/**
 * All distinct speakers across editions, keyed by slug. Where the same slug
 * appears in multiple editions the first name wins (cross-edition identity
 * merging by name is a later refinement).
 */
export function getAllSpeakers(): Speaker[] {
  const map = new Map<string, Speaker>();
  for (const data of getAllEditionData()) {
    for (const sp of data.speakers) if (!map.has(sp.slug)) map.set(sp.slug, sp);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Every session a speaker slug appears in, across editions. */
export function getSessionsForSpeaker(slug: string): SessionView[] {
  return getAllSessions().filter((v) => v.session.speakerSlugs.includes(slug));
}

export function getSpeakersForSession(view: SessionView): Speaker[] {
  const data = getAllEditionData().find(
    (d) => d.edition.id === view.edition.id,
  );
  if (!data) return [];
  return view.session.speakerSlugs
    .map((slug) => data.speakers.find((s) => s.slug === slug))
    .filter((s): s is Speaker => Boolean(s));
}

/** Categories that actually have sessions, in taxonomy order, with counts. */
export function getCategoryCounts(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { session } of getAllSessions()) {
    const c = session.category ?? "Uncategorized";
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getSessionsByCategory(category: string): SessionView[] {
  return getAllSessions().filter((v) => v.session.category === category);
}

// Sched event keys are case-sensitive (e.g. "2RHGs" vs "2RHGS"), but folder
// names and many hosts/CDNs are case-insensitive, so using the raw key as a URL
// segment silently drops colliding pages. Map each session to a lowercase,
// case-insensitively-unique URL id once, and route/link through it everywhere.
const urlIdMaps = (() => {
  const forward = new Map<string, string>(); // `${editionId}::${rawId}` -> urlId
  const reverse = new Map<string, string>(); // `${editionId}::${urlId}` -> rawId
  for (const data of getAllEditionData()) {
    const used = new Set<string>();
    for (const s of data.sessions) {
      const base =
        s.id
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "s";
      let candidate = base;
      let i = 2;
      while (used.has(candidate)) candidate = `${base}-${i++}`;
      used.add(candidate);
      forward.set(`${data.edition.id}::${s.id}`, candidate);
      reverse.set(`${data.edition.id}::${candidate}`, s.id);
    }
  }
  return { forward, reverse };
})();

/** The portable, lowercase URL id for a session within its edition. */
export function sessionUrlId(editionId: string, rawId: string): string {
  return urlIdMaps.forward.get(`${editionId}::${rawId}`) ?? rawId.toLowerCase();
}

/** The archive path for a session, e.g. "/sessions/mms-2026-midway/2rhgs/". */
export function sessionHref(view: SessionView): string {
  return `/sessions/${view.edition.id}/${sessionUrlId(view.edition.id, view.session.id)}/`;
}

/** Resolve a session from the URL id used in its path. */
export function getSessionByUrlId(
  editionId: string,
  urlId: string,
): SessionView | undefined {
  const rawId = urlIdMaps.reverse.get(`${editionId}::${urlId}`);
  return rawId ? getSession(editionId, rawId) : undefined;
}

export interface GroupedSession {
  /** The earliest occurrence, used as the representative/link target. */
  view: SessionView;
  /** How many times this title recurs in the same edition (1 = not recurring). */
  occurrences: number;
}

/**
 * Collapse recurring same-title slots within an edition into one entry (e.g.
 * Music City's 60 "MSFT Jam Session" 20-minute slots), keeping the earliest and
 * counting the rest, so listings stay sensible. Input order is preserved.
 */
export function groupRecurring(views: SessionView[]): GroupedSession[] {
  const groups = new Map<string, GroupedSession>();
  const order: string[] = [];
  for (const view of views) {
    const key = `${view.edition.id}::${view.session.title.trim().toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.occurrences += 1;
    } else {
      groups.set(key, { view, occurrences: 1 });
      order.push(key);
    }
  }
  return order.map((k) => groups.get(k)!);
}
