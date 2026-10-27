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
