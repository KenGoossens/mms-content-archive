# 06: Global search + unified filters (headline feature)

**What to build:** The topic-search experience that is the point of the site: free-text search across the whole corpus combined with Edition / Category / Speaker filters, so a visitor can find everything on a topic regardless of which Edition it was in.

**Blocked by:** 04, 05.

**Status:** ready-for-agent

- [ ] Client-side free-text search (Pagefind) over Session titles, abstracts, and Summaries across every loaded Edition
- [ ] Combinable filters by Edition, Category, and Speaker that narrow the results together with the search query
- [ ] Clicking a Speaker leads to their Sessions across Editions
- [ ] Search and filtering work on the static site with no server
- [ ] **Test (build smoke):** the build produces the search index and every Edition/Session yields a page
