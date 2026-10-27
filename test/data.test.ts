import { describe, it, expect } from "vitest";
import { groupRecurring, type SessionView } from "../src/lib/data";
import type { EditionMeta, Session } from "../src/lib/types";

const edition: EditionMeta = {
  id: "ed",
  name: "Ed",
  subdomain: "ed.sched.com",
  startDate: "2025-10-12",
  endDate: "2025-10-15",
  city: "Nashville, TN",
};

function session(id: string, title: string, start: string): SessionView {
  const s: Session = {
    id,
    editionId: "ed",
    title,
    url: `https://ed.sched.com/event/${id}`,
    abstract: "",
    abstractFull: false,
    start,
    end: null,
    timezone: null,
    dateLabel: null,
    venue: null,
    speakerSlugs: [],
    sourceTrack: null,
    category: "Community & Wingman",
    materials: [],
  };
  return { session: s, edition };
}

describe("groupRecurring", () => {
  it("collapses recurring same-title slots and counts occurrences", () => {
    const views = [
      session("a1", "MSFT Jam Session", "2025-10-13T08:00:00"),
      session("a2", "Open Jam Session", "2025-10-13T08:00:00"),
      session("a3", "MSFT Jam Session", "2025-10-13T08:20:00"),
      session("a4", "MSFT Jam Session", "2025-10-13T08:40:00"),
    ];
    const grouped = groupRecurring(views);
    expect(grouped.length).toBe(2);
    const msft = grouped.find(
      (g) => g.view.session.title === "MSFT Jam Session",
    )!;
    expect(msft.occurrences).toBe(3);
    // Keeps the earliest occurrence as the representative.
    expect(msft.view.session.id).toBe("a1");
    expect(
      grouped.find((g) => g.view.session.title === "Open Jam Session")!
        .occurrences,
    ).toBe(1);
  });

  it("leaves distinct titles untouched", () => {
    const views = [
      session("b1", "Talk A", "2025-10-13T09:00:00"),
      session("b2", "Talk B", "2025-10-13T09:00:00"),
    ];
    expect(groupRecurring(views).map((g) => g.occurrences)).toEqual([1, 1]);
  });
});
