# 01: Project scaffold

**What to build:** A repo skeleton for the MMS Content Archive that a developer can clone, build, and test. A static-site generator (Astro per ADR-0001), a test runner, lint, and a single build command that emits a deployable static site from a placeholder home page. This is the prefactor every later ticket builds on — make the change easy, then make the easy change.

**Blocked by:** None (can start immediately).

**Status:** done

- [ ] `build` produces a static site in an output directory, deployable to a free static host with no server or database
- [ ] `test` runs the test runner green against a trivial placeholder test
- [ ] Lint/format configured and passing
- [ ] A placeholder home page renders
- [ ] A conventional layout exists for pipeline code, normalized-data JSON, and test fixtures (so later tickets have a home), without hardcoding any Edition
