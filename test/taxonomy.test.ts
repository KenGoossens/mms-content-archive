import { describe, it, expect } from "vitest";
import {
  categorize,
  isMappedTrack,
  CATEGORIES,
  UNCATEGORIZED,
} from "../src/lib/taxonomy";

describe("taxonomy", () => {
  it("maps known Source Tracks to a defined Category", () => {
    const cases: Record<string, string> = {
      Intune: "Endpoint Management",
      ConfigMgr: "Configuration Manager",
      Windows: "Windows",
      Security: "Security",
      Azure: "Azure & Cloud",
      PowerShell: "Automation & Scripting",
      Wingman: "Community & Wingman",
      "Happy Hour": "Social & Networking",
      Sponsor: "Sponsor",
      Other: "Other",
    };
    for (const [track, category] of Object.entries(cases)) {
      expect(categorize(track)).toBe(category);
      expect(CATEGORIES).toContain(category);
      expect(isMappedTrack(track)).toBe(true);
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
