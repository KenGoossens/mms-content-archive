// Curated Category taxonomy (ADR-0003).
//
// Sched exposes only a top-level session *type* per session, and those raw types
// mix real topics (Intune, Security, Azure) with formats (Wingman, Happy Hour,
// Sponsor) and drift between editions. We map each raw Source Track onto a small
// Category vocabulary we control, so "categorize all content" stays coherent as
// editions are added. Unmapped tracks fall back to UNCATEGORIZED and are surfaced
// as warnings during ingest rather than silently dropped.

import { slugify } from "./slug";

export const UNCATEGORIZED = "Uncategorized";

/** The curated Categories, in display order. */
export const CATEGORIES = [
  "Endpoint Management",
  "Configuration Manager",
  "Windows",
  "Security",
  "Azure & Cloud",
  "Automation & Scripting",
  "Community & Wingman",
  "Social & Networking",
  "Sponsor",
  "Other",
  UNCATEGORIZED,
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Raw Source Track (lowercased) -> Category. Add rows here as new editions
 * surface unfamiliar tracks (ingest prints the unmapped ones).
 */
const TRACK_TO_CATEGORY: Record<string, Category> = {
  intune: "Endpoint Management",
  "endpoint manager": "Endpoint Management",
  mem: "Endpoint Management",
  configmgr: "Configuration Manager",
  "configuration manager": "Configuration Manager",
  sccm: "Configuration Manager",
  windows: "Windows",
  "windows 365": "Windows",
  autopilot: "Windows",
  security: "Security",
  azure: "Azure & Cloud",
  cloud: "Azure & Cloud",
  "azure & cloud": "Azure & Cloud",
  powershell: "Automation & Scripting",
  automation: "Automation & Scripting",
  scripting: "Automation & Scripting",
  wingman: "Community & Wingman",
  community: "Community & Wingman",
  "jam session": "Community & Wingman",
  "happy hour": "Social & Networking",
  welcome: "Social & Networking",
  social: "Social & Networking",
  networking: "Social & Networking",
  sponsor: "Sponsor",
  other: "Other",
};

/** The raw Source Track strings with an explicit mapping (used by tests). */
export const KNOWN_TRACKS = Object.keys(TRACK_TO_CATEGORY);

const normalize = (track: string) =>
  track.toLowerCase().replace(/\s+/g, " ").trim();

/** URL-safe slug for a Category, e.g. "Azure & Cloud" -> "azure-cloud". */
export function categorySlug(category: string): string {
  return slugify(category);
}

/** Resolve a Category from its slug, or undefined. */
export function categoryFromSlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => categorySlug(c) === slug);
}

/** True when a non-empty Source Track has an explicit Category mapping. */
export function isMappedTrack(track: string | null | undefined): boolean {
  if (!track) return false;
  return normalize(track) in TRACK_TO_CATEGORY;
}

/** Map a Source Track to its Category; unmapped or missing -> UNCATEGORIZED. */
export function categorize(track: string | null | undefined): Category {
  if (!track) return UNCATEGORIZED;
  return TRACK_TO_CATEGORY[normalize(track)] ?? UNCATEGORIZED;
}
