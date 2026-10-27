# Spec: MMS Content Archive

Status: ready-for-agent

A public, browsable, searchable static site that summarizes and categorizes the session content of past MMS (Midwest Management Summit) editions, built from the public Sched schedules. Vocabulary follows [CONTEXT.md](../../CONTEXT.md); decisions follow [docs/adr/](../../docs/adr/).

## Problem Statement

MMS content lives scattered across one Sched subdomain per Edition. There is no single place to browse what was covered across Editions, search by topic, find a Speaker's sessions, or get a quick sense of a Session without reading the full abstract. Each Edition labels its tracks differently, so even within Sched there is no consistent way to see "everything about a topic" across Editions. A visitor who wants a Session's slides has to know which Edition it was in and dig through that Edition's schedule.

## Solution

A single static website — the **MMS Content Archive** — that ingests the public Sched schedules of multiple Editions, normalizes them into a consistent model, generates a short Summary for each Session, assigns each Session a curated Category, and presents the whole corpus as one searchable, filterable archive. Visitors do free-text topic search and filter by Edition, Category, and Speaker; each Session shows its Summary and a link out to its Material download on Sched. The look is MMS-*inspired* (not official marks), with a clear "unofficial, community-made" disclaimer.

## User Stories

1. As a visitor, I want to browse all Sessions across every loaded Edition in one place, so that I don't have to visit five separate Sched subdomains.
2. As a visitor, I want to search Sessions by free text across titles, abstracts, and Summaries, so that I can find everything on a topic regardless of which Edition it was in.
3. As a visitor, I want to filter the corpus by Edition, so that I can focus on a single conference occurrence.
4. As a visitor, I want to filter by Category, so that I can see all Sessions on a topic area even when Editions labelled their tracks differently.
5. As a visitor, I want to filter by Speaker, so that I can see everything a given person presented across Editions.
6. As a visitor, I want to combine filters with search (e.g. "Intune" within the 2025 Editions), so that I can narrow quickly.
7. As a visitor, I want to read a short Summary of each Session, so that I can judge relevance without reading the full abstract.
8. As a visitor, I want to open a Session's detail view with its full abstract, Speakers, time, source track, and Category, so that I get the complete picture when I care.
9. As a visitor, I want a download link to a Session's Material (slides) when one exists, so that I can get the deck.
10. As a visitor, I want to understand that a Material link may require a Sched attendee login, so that I'm not surprised when some downloads prompt for sign-in.
11. As a visitor, I want to click a Speaker to see their other Sessions, so that I can follow a presenter's work.
12. As a visitor, I want a Category index page, so that I can explore the archive by topic area.
13. As a visitor, I want an Edition index page listing each Edition with its dates and Session count, so that I can orient by occurrence.
14. As a visitor, I want the site to clearly state it is an unofficial, community-made archive, so that I don't mistake it for an official MMS property.
15. As a visitor, I want the site to be fast and work on mobile, so that I can browse anywhere.
16. As a visitor, I want a visually polished, MMS-inspired design with a subtle gradient grid background, so that the archive feels on-brand and considered.
17. As a visitor, I want Sessions without a Material to simply omit the download link rather than show a broken one, so that the UI stays trustworthy.
18. As a maintainer, I want to run a single pipeline command to ingest one Edition from its Sched subdomain, so that adding an Edition is one step.
19. As a maintainer, I want the pipeline to be idempotent and re-runnable, so that re-ingesting an Edition updates data cleanly without duplicates.
20. As a maintainer, I want the scraper to be polite (rate-limited under 30 req/min, explicit User-Agent), so that I stay within Sched's constraints.
21. As a maintainer, I want normalized Session data stored as human-readable JSON in the repo, so that I can diff and review ingestion changes.
22. As a maintainer, I want Summary generation to be cached on disk, so that re-running the pipeline doesn't re-pay for unchanged Sessions.
23. As a maintainer, I want to map a new Edition's raw Source Tracks onto the curated Category taxonomy, so that categorization stays consistent as Editions are added.
24. As a maintainer, I want the pipeline to flag Source Tracks it doesn't recognize, so that I know when a new Edition needs a mapping update.
25. As a maintainer, I want the build to produce a fully static site deployable to a free static host, so that hosting is cheap and simple.
26. As a maintainer, I want the pipeline to store only Speaker name, public session list, and public profile link, so that I respect Sched's terms against harvesting personal data.
27. As a maintainer, I want to load MMS 2026 Midway Edition first and the four most recent prior Editions next, so that the archive launches with a meaningful corpus.

## Implementation Decisions

- **Editions in scope (first load):** MMS 2026 Midway (`mmsmidway.sched.com`), MMS 2026 at MOA (`mms2026atmoa.sched.com`), MMS 2025 Music City (`mms2025music.sched.com`), MMS 2025 at MOA (`mms2025atmoa.sched.com`), MMS 2024 Flamingo (`mms2024fll.sched.com`). The model must accept more Editions without code changes — Editions are data, not hardcoded.
- **Pipeline stages (ADR-0001):** `fetch → parse/normalize → summarize → render`, run per Edition, idempotent and re-runnable.
  - **Fetch:** a thin network layer that pulls each Edition's public Sched pages, preferring `/list/descriptions` (full abstracts) and `/list/simple` (clean listing). Rate-limited (<30 req/min) with an explicit User-Agent. Fetch is injectable so that normalization can be driven from saved HTML without the network.
  - **Parse/normalize:** the core transform. Input is raw Sched HTML; output is normalized `Edition` and `Session` records plus `Speaker` records. This is the single primary test seam.
  - **Summarize:** per-Session Summary generated via the Anthropic API (Claude), written once and cached on disk keyed by a stable Session identity; cache hits skip the API call.
  - **Render:** static-site build consuming the normalized JSON.
- **Data model (glossary-aligned):**
  - `Edition`: name, Sched subdomain/base URL, dates, venue/city, list of Session ids.
  - `Session`: stable id (derive from Sched's session `key`/slug), title, full abstract, Summary, start/end, venue, Speaker ids, raw Source Track(s), mapped Category, Material link (nullable).
  - `Speaker`: name, public profile URL, Session ids. No emails, photos, or extended bios (ADR-0002).
  - `Category`: curated taxonomy entry; each Session maps to exactly one primary Category (secondary categories optional, decide during build if cheap).
- **Storage:** normalized data as human-readable JSON committed in the repo, one record (or one file per Edition) in a predictable location; re-running overwrites deterministically so diffs are clean.
- **Taxonomy mapping (ADR-0003):** a maintained mapping table from raw Source Track strings → curated Category. Unmapped Source Tracks are surfaced as warnings (and routed to a sensible default/"Uncategorized") rather than silently dropped.
- **Materials (ADR-0002):** the Session detail links to Sched's own Material download URL; files are never mirrored. Absent Material → no link rendered.
- **Site:** static site (Astro or 11ty) with client-side search via Pagefind. Pages: home/all-sessions with search + Edition/Category/Speaker filters, Session detail, Speaker page, Category index, Edition index. MMS-inspired palette and typography (not official marks); subtle gradient grid background; prominent "unofficial / community-made" disclaimer; responsive/mobile-first.
- **Hosting:** deployable to a free static host (Cloudflare Pages / Netlify / GitHub Pages); no server or database.
- **Summarization provider:** Anthropic API (Claude), latest capable model; summaries are short (judge-relevance length), deterministic enough to cache.

## Testing Decisions

- **What makes a good test here:** assert external behavior (the normalized records a given Sched page produces, the Category a Source Track maps to, whether a cached Summary is reused), never internal structure of the parser. Tests must not hit the network or the Anthropic API.
- **Primary seam — normalize (highest-value, deterministic):** feed saved real HTML fixtures captured from each Edition's `/list/descriptions` (and `/list/simple`) into the parse/normalize transform and assert the resulting `Edition`/`Session`/`Speaker` records: title, Speakers, start/end, source track, and the Source Track → Category mapping. Include at least one fixture per Edition so inter-Edition drift is covered, plus edge cases (Session with no Material, Session with multiple Speakers, repeating/duplicate slots like Music City "Jam Session").
- **Taxonomy mapping:** covered through the normalize seam via fixtures; additionally a direct table test that every known Source Track resolves to a Category and that an unknown Source Track produces a warning + default.
- **Summary cache plumbing (thin seam):** given a pre-populated cache, re-running summarize reuses the cached Summary and makes zero API calls (inject a stubbed/fake summarizer client and assert it is not invoked on a cache hit); cache key is stable across runs for an unchanged Session.
- **Build smoke test (thin seam):** the static build completes, every Edition and Session yields a page, and the search index is produced.
- **Explicitly not tested:** the live network fetch and the actual LLM-generated prose. The fetch layer is exercised only through fixtures; Summary *content* is not asserted.
- **Prior art:** none yet (new repo). Establish the fixture-driven normalize test as the pattern subsequent tests follow.

## Out of Scope

- Rehosting or mirroring Materials (slides/recordings); we only link to Sched.
- Any content requiring an organizer Sched API key or admin Reports access; ingestion is public-HTML only.
- Scraping or storing Speaker personal data beyond name + public profile link.
- User accounts, comments, favorites, or any write/interactive features; the site is read-only.
- Category roll-up summaries and cross-Edition theme summaries (fast-follow, after per-Session Summaries land and multiple Editions are loaded).
- Editions earlier than the five in scope (e.g. MMS 2024 at MOA, MMS 2023 Miami Beach) — loadable later as data, not part of first delivery.
- Official MMS logo/trademark usage.

## Further Notes

- Several Editions state their slides are "open to the public," so many Material links will work for anonymous visitors; others may prompt for a Sched attendee login — the UI should set that expectation (user story 10).
- Sched subdomain naming is inconsistent (`mms<year>atmoa`, `mmsmidway`, `mms2025music`, `mms2024fll`); a non-existent subdomain 302-redirects to `www.sched.com` while a real one returns 200 — useful as a cheap existence check when adding future Editions.
- Session counts per Edition are small (tens to low hundreds), which is what justifies the static-site + in-repo-JSON choice over a database (ADR-0001).
