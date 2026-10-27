import type { EditionMeta } from "./types";

// The editions in scope, most recent first. Editions are data, not hardcoded
// logic (ADR-0001): adding one is a new entry here plus an ingest run.
// Ticket 02 ingests only the primary (Midway); ticket 05 loads them all.
export const EDITIONS: EditionMeta[] = [
  {
    id: "mms-2026-midway",
    name: "MMS 2026 Midway Edition",
    subdomain: "mmsmidway.sched.com",
    startDate: "2026-10-25",
    endDate: "2026-10-28",
    city: "San Diego, CA",
  },
  {
    id: "mms-2026-moa",
    name: "MMS 2026 at MOA",
    subdomain: "mms2026atmoa.sched.com",
    startDate: "2026-05-03",
    endDate: "2026-05-07",
    city: "Bloomington, MN",
  },
  {
    id: "mms-2025-music-city",
    name: "MMS 2025 Music City Edition",
    subdomain: "mms2025music.sched.com",
    startDate: "2025-10-12",
    endDate: "2025-10-15",
    city: "Nashville, TN",
  },
  {
    id: "mms-2025-moa",
    name: "MMS 2025 at MOA",
    subdomain: "mms2025atmoa.sched.com",
    startDate: "2025-05-04",
    endDate: "2025-05-08",
    city: "Bloomington, MN",
  },
  {
    id: "mms-2024-flamingo",
    name: "MMS 2024 Flamingo Edition",
    subdomain: "mms2024fll.sched.com",
    startDate: "2024-10-20",
    endDate: "2024-10-23",
    city: "Fort Lauderdale, FL",
  },
];

export function editionById(id: string): EditionMeta | undefined {
  return EDITIONS.find((e) => e.id === id);
}
