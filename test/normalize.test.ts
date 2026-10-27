import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parseEdition } from "../src/lib/sched/parse";
import { parseSchedDate } from "../src/lib/sched/datetime";
import { editionById } from "../src/lib/editions";
import { CATEGORIES } from "../src/lib/taxonomy";
import type { EditionData } from "../src/lib/types";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures", name), "utf8");

function parse(editionId: string, file: string): EditionData {
  const meta = editionById(editionId)!;
  return parseEdition(fixture(file), meta);
}

describe("parseEdition — MMS Midway (upcoming, no materials)", () => {
  const data = parse("mms-2026-midway", "midway_descriptions.html");

  it("extracts every session and speaker", () => {
    expect(data.sessions.length).toBe(165);
    expect(data.speakers.length).toBeGreaterThan(0);
  });

  it("normalizes a known session's core fields", () => {
    const s = data.sessions.find((s) => s.id === "2WaTg");
    expect(s).toBeDefined();
    expect(s!.title).toContain("Rekindling the Wall of Fire");
    expect(s!.start).toBe("2026-10-27T07:00:00");
    expect(s!.end).toBe("2026-10-27T07:45:00");
    expect(s!.timezone).toBe("PDT");
    expect(s!.url).toBe("https://mmsmidway.sched.com/event/2WaTg");
    expect(s!.sourceTrack).toBeTruthy();
  });

  it("absolutizes speaker profile links and stores only name + slug + url", () => {
    const sp = data.speakers[0];
    expect(sp.profileUrl).toMatch(
      /^https:\/\/mmsmidway\.sched\.com\/speaker\//,
    );
    expect(Object.keys(sp).sort()).toEqual(["name", "profileUrl", "slug"]);
  });

  it("has no materials for an upcoming edition (download link omitted)", () => {
    expect(data.sessions.every((s) => s.materials.length === 0)).toBe(true);
  });

  it("assigns every session a Category from the taxonomy", () => {
    expect(
      data.sessions.every(
        (s) => s.category && CATEGORIES.includes(s.category as never),
      ),
    ).toBe(true);
  });

  it("maps a known Source Track to its Category", () => {
    // 2WaTg's Source Track is "Sponsor" -> Sponsor; an Intune session -> Endpoint Management.
    const sponsor = data.sessions.find((s) => s.id === "2WaTg");
    expect(sponsor!.sourceTrack).toBe("Sponsor");
    expect(sponsor!.category).toBe("Sponsor");

    const intune = data.sessions.find((s) => s.sourceTrack === "Intune");
    expect(intune?.category).toBe("Endpoint Management");
  });
});

describe("parseEdition — MMS 2024 Flamingo (ended, has materials)", () => {
  const data = parse("mms-2024-flamingo", "fll2024_descriptions.html");

  it("extracts the ended edition's sessions", () => {
    expect(data.sessions.length).toBe(87);
  });

  it("extracts downloadable materials hosted on Sched", () => {
    const withMaterials = data.sessions.filter((s) => s.materials.length > 0);
    expect(withMaterials.length).toBeGreaterThan(0);
    const m = withMaterials[0].materials[0];
    expect(m.url).toMatch(/^https?:\/\//);
    expect(m.ext).toBeTruthy();
  });

  it("handles sessions with multiple speakers", () => {
    const multi = data.sessions.find((s) => s.speakerSlugs.length >= 2);
    expect(multi).toBeDefined();
  });
});

describe("parseEdition — every edition fixture (inter-edition drift)", () => {
  const cases: [string, string, number][] = [
    ["mms-2026-midway", "midway_descriptions.html", 165],
    ["mms-2026-moa", "moa2026_descriptions.html", 151],
    ["mms-2025-music-city", "music2025_descriptions.html", 207],
    ["mms-2025-moa", "moa2025_descriptions.html", 147],
    ["mms-2024-flamingo", "fll2024_descriptions.html", 87],
  ];

  it.each(cases)("parses %s with stable fields", (editionId, file, count) => {
    const data = parse(editionId, file);
    expect(data.sessions.length).toBe(count);
    // Every session has a stable id, a title, and a Category.
    expect(data.sessions.every((s) => s.id && s.title && s.category)).toBe(
      true,
    );
    // Ids are unique within the edition.
    expect(new Set(data.sessions.map((s) => s.id)).size).toBe(count);
  });
});

describe("parseSchedDate", () => {
  it("parses a full Sched date/time string", () => {
    expect(
      parseSchedDate("Tuesday October 27, 2026  7:00am -  7:45am PDT"),
    ).toEqual({
      start: "2026-10-27T07:00:00",
      end: "2026-10-27T07:45:00",
      timezone: "PDT",
      dateLabel: "Tuesday October 27, 2026",
    });
  });

  it("handles afternoon times (pm) and midnight/noon correctly", () => {
    const pm = parseSchedDate("Monday May 5, 2025 1:30pm - 2:00pm CDT");
    expect(pm.start).toBe("2025-05-05T13:30:00");
    expect(pm.end).toBe("2025-05-05T14:00:00");
    const noon = parseSchedDate("Monday May 5, 2025 12:00pm - 12:30pm CDT");
    expect(noon.start).toBe("2025-05-05T12:00:00");
  });

  it("is resilient to unrecognised strings", () => {
    const r = parseSchedDate("TBD");
    expect(r.start).toBeNull();
    expect(r.dateLabel).toBe("TBD");
  });
});
