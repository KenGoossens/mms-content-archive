# 05: Load all 5 Editions + Edition index

**What to build:** Scale the single-Edition pipeline to the full launch corpus and make the archive navigable by Edition. Run the pipeline across all five in-scope Editions (mapping each one's Source Tracks onto the Category taxonomy) and add an Edition index.

**Blocked by:** 03.

**Status:** done

- [ ] The pipeline ingests all five Editions as data (no hardcoding): MMS 2026 Midway (`mmsmidway.sched.com`), MMS 2026 at MOA (`mms2026atmoa.sched.com`), MMS 2025 Music City (`mms2025music.sched.com`), MMS 2025 at MOA (`mms2025atmoa.sched.com`), MMS 2024 Flamingo (`mms2024fll.sched.com`)
- [ ] Each Edition's raw Source Tracks are mapped to Categories; any unmapped tracks are reported for follow-up rather than silently defaulted without notice
- [ ] An Edition index page lists each Edition with its name, dates, and Session count
- [ ] Sessions from all Editions browse together; the all-sessions list and Category views span the full corpus
- [ ] Repeating/duplicate slots (e.g. Music City "Jam Session") are handled so counts and listings are sensible
- [ ] **Test:** at least one normalize fixture per Edition so inter-Edition drift is covered by the seam
