import { describe, it, expect } from "vitest";

// Placeholder test proving the test runner is wired up (ticket 01).
// The real logic seam — fixture-driven normalize tests — arrives in ticket 02.
describe("scaffold", () => {
  it("runs the test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
