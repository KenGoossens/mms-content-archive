// Domain model for the MMS Content Archive. Vocabulary follows CONTEXT.md.

/** One occurrence of MMS, identified by its own Sched subdomain. */
export interface EditionMeta {
  /** Stable slug used in URLs and data filenames, e.g. "mms-2026-midway". */
  id: string;
  /** Full display name, e.g. "MMS 2026 Midway Edition". */
  name: string;
  /** Sched host, e.g. "mmsmidway.sched.com". */
  subdomain: string;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD). */
  endDate: string;
  city: string;
}

/**
 * A person who presents a Session. Per ADR-0002 and Sched's terms we store only
 * the minimum public identity — name and public profile link — never emails,
 * photos, company, or bios.
 */
export interface Speaker {
  /** Sched speaker slug; stable id within an edition's host. */
  slug: string;
  name: string;
  /** Absolute URL to the public Sched profile. */
  profileUrl: string;
}

/** A speaker-uploaded artifact (primarily a deck). We link, never re-host (ADR-0002). */
export interface Material {
  label: string;
  /** Absolute download URL on Sched (hosted-files.sched.co). */
  url: string;
  /** Lowercase extension hint, e.g. "pdf", "pptx", "zip". */
  ext: string;
}

/** One scheduled item in an edition's catalog. */
export interface Session {
  /** Sched event KEY (e.g. "2WaTg"); the stable primary key. */
  id: string;
  editionId: string;
  title: string;
  /** Absolute URL to the session's Sched detail page. */
  url: string;
  /** Abstract text. Truncated excerpt from the list page unless `abstractFull`. */
  abstract: string;
  /** True when the abstract is the complete text (upgraded from the detail page). */
  abstractFull: boolean;
  /** Naive local datetime "YYYY-MM-DDTHH:mm:ss" (timezone in `timezone`), or null. */
  start: string | null;
  end: string | null;
  /** Timezone abbreviation as shown by Sched, e.g. "PDT". No numeric offset is available. */
  timezone: string | null;
  /** Human date label as shown, e.g. "Tuesday October 27, 2026". */
  dateLabel: string | null;
  venue: string | null;
  /** Slugs referencing entries in the edition's `speakers`. */
  speakerSlugs: string[];
  /** Top-level Sched session type (the only track granularity the HTML exposes). */
  sourceTrack: string | null;
  /** Normalized Category (ticket 03); null until the taxonomy is applied. */
  category: string | null;
  materials: Material[];
}

/** Everything ingested for one edition, written as one JSON file under src/data. */
export interface EditionData {
  edition: EditionMeta;
  sessions: Session[];
  speakers: Speaker[];
}
