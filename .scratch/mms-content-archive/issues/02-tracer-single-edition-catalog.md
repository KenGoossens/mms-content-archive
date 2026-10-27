# 02: Tracer bullet — one Edition, end-to-end (catalog only)

**What to build:** The thin complete path through the whole system for a single Edition (MMS 2026 Midway, `mmsmidway.sched.com`): fetch its public Sched schedule, normalize it into domain records, and render a browsable static site of that Edition's catalog. No Categories, Summaries, or search yet — those are later slices. This ticket establishes the primary test seam the rest of the project follows.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A thin fetch layer pulls the Edition's public Sched pages (prefer `/list/descriptions`), rate-limited under 30 req/min with an explicit User-Agent; the fetch is injectable so normalization can run from saved HTML without the network
- [ ] A normalize transform turns raw Sched HTML into `Edition`, `Session`, and `Speaker` records (glossary-aligned): Session has stable id (from Sched's session key/slug), title, full abstract, start/end, venue, speaker ids, raw Source Track(s), and a nullable Material link
- [ ] Normalized data is written as human-readable JSON committed in the repo; re-running overwrites deterministically (idempotent, clean diffs)
- [ ] Speaker records store only name, public profile URL, and session ids — no emails, photos, or extended bios (ADR-0002)
- [ ] The site renders: an all-sessions list page, a Session detail page (abstract, speakers, time, source track, Material link only when present), and a Speaker page listing that speaker's sessions
- [ ] A Session with no Material renders no download link (no broken link)
- [ ] **Primary test seam:** a fixture-driven normalize test feeds a saved real `/list/descriptions` page and asserts the resulting records (title, speakers, start/end, source track), including the edge cases: a Session with no Material and a Session with multiple Speakers. Tests hit neither the network nor any LLM
- [ ] The full static site builds and is deployable
