# 04: Per-Session Summaries

**What to build:** Give each Session a short generated Summary so visitors can judge relevance without reading the full abstract. Add the summarize pipeline stage using the Anthropic API (Claude), generated once and cached on disk so re-runs don't re-pay for unchanged Sessions.

**Blocked by:** 02. (Runs in parallel with 03.)

**Status:** ready-for-agent

- [ ] A summarize stage generates a short Summary per Session via the Anthropic API (latest capable Claude model)
- [ ] Summaries are cached on disk, keyed by a stable per-Session identity; a cache hit skips the API call
- [ ] The Summary is stored on the Session record and rendered on both the list and detail views
- [ ] **Test (cache plumbing):** with a pre-populated cache and a stubbed summarizer client, re-running summarize reuses the cached Summary and makes zero API calls; the cache key is stable across runs for an unchanged Session. Summary prose content is not asserted
