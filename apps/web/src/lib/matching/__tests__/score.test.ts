import { describe, it, expect } from "vitest";
import { computeMatch, DEFAULT_WEIGHTS, type StudentData, type InternshipData } from "@/lib/matching/score";

const baseStudent: StudentData = {
  track: "webbutveckling",
  city: "Stockholm",
  skills: ["react", "typescript", "node"],
  availability_periods: [{ start: "2025-01-01", end: "2025-06-30" }],
};

const baseInternship: InternshipData = {
  track_focus: "webbutveckling",
  skills: ["react", "typescript"],
  city: "Stockholm",
  period_start: "2025-02-01",
  period_end: "2025-05-01",
};

describe("computeMatch", () => {
  it("returns perfect score for exact match", () => {
    const result = computeMatch(baseStudent, baseInternship);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.reasons).toHaveLength(4);
  });

  it("returns low score for completely different profiles", () => {
    const student: StudentData = {
      track: "ux",
      city: "Malmö",
      skills: ["figma"],
      availability_periods: [{ start: "2026-01-01", end: "2026-06-30" }],
    };
    const result = computeMatch(student, baseInternship);
    expect(result.score).toBeLessThan(30);
  });

  it("gives partial points for related tracks", () => {
    const student = { ...baseStudent, track: "frontend" };
    const result = computeMatch(student, baseInternship);
    const trackReason = result.reasons.find((r) => r.key === "track");
    expect(trackReason).toBeDefined();
    expect(trackReason!.points).toBeGreaterThan(0);
    expect(trackReason!.label).toBe("track_related");
  });

  it("gives partial points for same-region city", () => {
    const student = { ...baseStudent, city: "Solna" };
    const result = computeMatch(student, baseInternship);
    const cityReason = result.reasons.find((r) => r.key === "city");
    expect(cityReason).toBeDefined();
    expect(cityReason!.points).toBeGreaterThan(0);
    expect(cityReason!.label).toBe("city_region");
  });

  it("handles remote city matching", () => {
    const internship = { ...baseInternship, city: "remote" };
    const result = computeMatch(baseStudent, internship);
    const cityReason = result.reasons.find((r) => r.key === "city");
    expect(cityReason!.label).toBe("city_remote");
  });

  it("gives full period points for full containment", () => {
    const result = computeMatch(baseStudent, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason!.label).toBe("period_full");
  });

  it("gives 0 period points when no overlap", () => {
    const student = {
      ...baseStudent,
      availability_periods: [{ start: "2024-01-01", end: "2024-06-30" }],
    };
    const result = computeMatch(student, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason!.points).toBe(0);
  });

  it("respects custom weights", () => {
    const cityHeavy = computeMatch(baseStudent, baseInternship, { city: 80, track: 5, skills: 5, period: 10 });
    const trackHeavy = computeMatch(baseStudent, baseInternship, { track: 80, city: 5, skills: 5, period: 10 });
    // Both should still produce valid scores
    expect(cityHeavy.score).toBeGreaterThan(0);
    expect(trackHeavy.score).toBeGreaterThan(0);
    expect(cityHeavy.score).toBeLessThanOrEqual(100);
  });

  it("score never exceeds 100", () => {
    const result = computeMatch(baseStudent, baseInternship, { track: 100, skills: 100, city: 100, period: 100 });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("handles empty skills gracefully", () => {
    const student = { ...baseStudent, skills: [] };
    const internship = { ...baseInternship, skills: [] };
    const result = computeMatch(student, internship);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("DEFAULT_WEIGHTS sum to 100", () => {
    const sum = DEFAULT_WEIGHTS.track + DEFAULT_WEIGHTS.skills + DEFAULT_WEIGHTS.city + DEFAULT_WEIGHTS.period;
    expect(sum).toBe(100);
  });
});
