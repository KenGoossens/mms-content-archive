import { describe, it, expect } from "vitest";
import {
  categorize,
  isMappedTrack,
  CATEGORIES,
  KNOWN_TRACKS,
  UNCATEGORIZED,
} from "../src/lib/taxonomy";

describe("taxonomy", () => {
  it("resolves every known Source Track to a defined, non-default Category", () => {
    expect(KNOWN_TRACKS.length).toBeGreaterThan(0);
    for (const track of KNOWN_TRACKS) {
      const category = categorize(track);
      expect(CATEGORIES).toContain(category);
      expect(category).not.toBe(UNCATEGORIZED);
      expect(isMappedTrack(track)).toBe(true);
    }
  });

  it("maps representative tracks to their expected Category", () => {
    const cases: Record<string, string> = {
      Intune: "Endpoint Management",
      ConfigMgr: "Configuration Manager",
      Windows: "Windows",
      Security: "Security",
      Azure: "Azure & Cloud",
      PowerShell: "Automation & Scripting",
      Wingman: "Community & Wingman",
      "Jam Session": "Community & Wingman",
      "Happy Hour": "Social & Networking",
      Sponsor: "Sponsor",
      Other: "Other",
    };
    for (const [track, category] of Object.entries(cases)) {
      expect(categorize(track)).toBe(category);
    }
  });

  it("is case- and whitespace-insensitive", () => {
    expect(categorize("  intune ")).toBe("Endpoint Management");
    expect(categorize("HAPPY   HOUR")).toBe("Social & Networking");
  });

  it("falls back to Uncategorized for unknown or missing tracks", () => {
    expect(categorize("Quantum Blockchain")).toBe(UNCATEGORIZED);
    expect(categorize(null)).toBe(UNCATEGORIZED);
    expect(categorize("")).toBe(UNCATEGORIZED);
    expect(isMappedTrack("Quantum Blockchain")).toBe(false);
    expect(isMappedTrack(null)).toBe(false);
  });
});
