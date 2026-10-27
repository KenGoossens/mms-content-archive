# `src/lib` — pipeline code

The ingestion pipeline lives here (ADR-0001): `fetch → parse/normalize → (summarize, deferred) → render`.

- **fetch** — thin, injectable network layer over public Sched pages (rate-limited, explicit User-Agent).
- **normalize** — pure transform from raw Sched HTML to `Edition` / `Session` / `Speaker` records. The primary test seam.
- **taxonomy** — curated Category and the Source Track → Category mapping (ticket 03).

Normalized output is written as JSON under `src/data/` and consumed by the Astro pages.
