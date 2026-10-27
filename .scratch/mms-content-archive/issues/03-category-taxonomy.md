# 03: Category taxonomy

**What to build:** Make the single Edition browsable by topic area. Introduce the curated Category taxonomy and a maintained mapping from raw Source Track strings to Categories (ADR-0003), applied during normalize, so categorization stays consistent as Editions are added. Surface Categories in the UI.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A curated Category taxonomy is defined as data, plus a mapping table from Source Track → Category
- [ ] Normalize assigns each Session a primary Category via the mapping
- [ ] An unmapped Source Track produces a warning and routes the Session to a sensible default ("Uncategorized") rather than being dropped
- [ ] Session detail shows its Category; a Category index page lists Categories; a Category filter narrows the session list
- [ ] **Tests:** the normalize fixture test asserts the Source Track → Category mapping; a direct table test asserts every known Source Track resolves to a Category and that an unknown Source Track yields a warning + default
