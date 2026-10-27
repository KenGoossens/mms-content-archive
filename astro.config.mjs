// @ts-check
import { defineConfig } from "astro/config";

// Static output (ADR-0001): the whole site builds to static files, deployable
// to a free static host with no server or database.
export default defineConfig({
  // `site` is set to the deploy URL once hosting is chosen; a placeholder keeps
  // absolute-URL helpers working during local builds.
  site: "https://example.com",
  output: "static",
});
