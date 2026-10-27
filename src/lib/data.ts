// Build-time data access for Astro pages. Loads every committed edition JSON via
// Vite's import.meta.glob (eager), so pages never touch the filesystem or network.
// Only imported from .astro pages — tests import the pipeline modules directly.

import type { EditionData, EditionMeta, Session, Speaker } from "./types";
import { UNCATEGORIZED } from "./taxonomy";
import { slugify } from "./slug";

const modules = import.meta.glob<EditionData>("../data/editions/*.json", {
  eager: true,
  import: "default",
});

/** Normalize a speaker name for cross-edition identity matching. */
function normName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

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

// A person may appear in several editions under different Sched slugs, so
// speaker identity is keyed by normalized name. The first-seen speaker is the
// representative (its slug owns the URL); every slug for that name maps to it.
const speakerByName = (() => {
  const rep = new Map<string, Speaker>();
  for (const data of getAllEditionData()) {
    for (const sp of data.speakers) {
      const key = normName(sp.name);
      if (!rep.has(key)) rep.set(key, sp);
    }
  }
  return rep;
})();

/** All distinct speakers across editions, merged by name. */
export function getAllSpeakers(): Speaker[] {
  return [...speakerByName.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/** The archive path for a speaker, routed through their representative slug. */
export function speakerHref(speaker: Speaker): string {
  const rep = speakerByName.get(normName(speaker.name)) ?? speaker;
  return `/speakers/${rep.slug}/`;
}

/** Every session a speaker appears in, across editions, matched by name. */
export function getSessionsForSpeaker(slug: string): SessionView[] {
  const rep = [...speakerByName.values()].find((s) => s.slug === slug);
  if (!rep) return [];
  const name = normName(rep.name);
  return getAllSessions().filter((v) =>
    getSpeakersForSession(v).some((s) => normName(s.name) === name),
  );
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

/** Comma-separated speaker names for a session (shared by listing pages). */
export function speakerNames(view: SessionView): string {
  return getSpeakersForSession(view)
    .map((s) => s.name)
    .join(", ");
}

/** Categories that actually have sessions, in taxonomy order, with counts. */
export function getCategoryCounts(): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const { session } of getAllSessions()) {
    const c = session.category ?? UNCATEGORIZED;
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
      const base = slugify(s.id) || "s";
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
