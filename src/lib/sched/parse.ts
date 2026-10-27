// Pure transform: raw Sched `/list/descriptions` HTML -> normalized domain records.
// No network, no I/O. This is the project's primary test seam (ticket 02).

import * as cheerio from "cheerio";
import type {
  EditionData,
  EditionMeta,
  Material,
  Session,
  Speaker,
} from "../types";
import { parseSchedDate } from "./datetime";

/** Build an absolute URL from a relative Sched href against the edition host. */
function absolutize(subdomain: string, href: string): string {
  const clean = href.replace(/^\//, "");
  if (/^https?:\/\//i.test(href)) return href;
  return `https://${subdomain}/${clean}`;
}

/** Extract the stable event KEY from an `event/<KEY>/<slug>` href. */
function eventKey(href: string): string | null {
  const m = href.match(/event\/([^/"?#]+)/);
  return m ? m[1] : null;
}

const clean = (s: string | undefined | null) =>
  (s ?? "").replace(/\s+/g, " ").trim();

/**
 * Parse one edition's `/list/descriptions` page into Edition/Session/Speaker
 * records. `meta` supplies the edition identity (and host for absolutizing URLs).
 */
export function parseEdition(html: string, meta: EditionMeta): EditionData {
  const $ = cheerio.load(html);
  const sessions: Session[] = [];
  const speakerMap = new Map<string, Speaker>();

  $("div.sched-container").each((_, el) => {
    const $c = $(el);

    const $name = $c.find("a.name").first();
    const href = $name.attr("href") ?? "";
    const id = eventKey(href);
    const title =
      clean($name.find("span.session-title").first().text()) ||
      clean($name.text());
    if (!id || !title) return; // not a real session row

    // Abstract: the list page truncates and appends a "See More" link.
    const $desc = $c.find("div.tip-description").first().clone();
    $desc.find("a").each((_, a) => {
      if (/see more/i.test($(a).text())) $(a).remove();
    });
    const abstract = clean($desc.text())
      .replace(/\s*\.\.\.\s*$/, "")
      .trim();

    // Date / time.
    const dateRaw = clean($c.find("div.list-single__date").first().text());
    const parsed = parseSchedDate(dateRaw);

    // Venue.
    const venue =
      clean(
        $c.find('div.list-single__location a[href^="venue/"]').first().text(),
      ) || null;

    // Speakers (exclude sponsors, which share markup but use sponsor/ hrefs).
    const speakerSlugs: string[] = [];
    $c.find('div.sched-person-session h2 > a[href^="speaker/"]').each(
      (_, a) => {
        const sHref = $(a).attr("href") ?? "";
        const slug = sHref.replace(/^speaker\//, "").split(/[?#]/)[0];
        const name = clean($(a).text());
        if (!slug || !name) return;
        if (!speakerMap.has(slug)) {
          speakerMap.set(slug, {
            slug,
            name,
            profileUrl: absolutize(meta.subdomain, sHref),
          });
        }
        if (!speakerSlugs.includes(slug)) speakerSlugs.push(slug);
      },
    );

    // Source Track: top-level session type only.
    const sourceTrack =
      clean(
        $c
          .find('div.sched-event-type a[href^="list/descriptions/type/"]')
          .first()
          .text(),
      ) || null;

    // Materials (ended editions only): link, never re-host. The uploaded-file
    // blocks (div.sched-file) are not always wrapped in div.tip-media, so match
    // them directly within the session container.
    const materials: Material[] = [];
    $c.find("div.sched-file").each((_, f) => {
      const $a = $(f).find("a.file-uploaded[href]").first();
      const url = $a.attr("href");
      if (!url) return;
      const extFromSpan = clean(
        $(f).find("span.sched-file-extension").first().text(),
      ).toLowerCase();
      const extFromUrl = (url.split(".").pop() ?? "")
        .toLowerCase()
        .split(/[?#]/)[0];
      materials.push({
        label: clean($a.text()) || "Download",
        url,
        ext: extFromSpan || extFromUrl || "",
      });
    });

    sessions.push({
      id,
      editionId: meta.id,
      title,
      url: absolutize(meta.subdomain, `event/${id}`),
      abstract,
      abstractFull: false,
      start: parsed.start,
      end: parsed.end,
      timezone: parsed.timezone,
      dateLabel: parsed.dateLabel,
      venue,
      speakerSlugs,
      sourceTrack,
      category: null,
      materials,
    });
  });

  const speakers = [...speakerMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return { edition: meta, sessions, speakers };
}

/**
 * Extract the full (untruncated) abstract from a session detail page
 * (`/event/<KEY>`). Used only when upgrading list excerpts to full text.
 */
export function parseSessionAbstract(html: string): string {
  const $ = cheerio.load(html);
  const $desc = $("div.tip-description").first().clone();
  $desc.find("a").each((_, a) => {
    if (/see more/i.test($(a).text())) $(a).remove();
  });
  return clean($desc.text());
}
