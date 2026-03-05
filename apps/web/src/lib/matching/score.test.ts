import { describe, it, expect } from "vitest";
import {
  computeMatch,
  DEFAULT_WEIGHTS,
  type StudentData,
  type InternshipData,
} from "./score";

const baseStudent: StudentData = {
  track: "Webbutveckling",
  city: "Stockholm",
  skills: ["React", "TypeScript", "Node.js"],
  availability_periods: [{ start: "2026-03-01", end: "2026-06-30" }],
};

const baseInternship: InternshipData = {
  track_focus: "Webbutveckling",
  skills: ["React", "TypeScript"],
  city: "Stockholm",
  period_start: "2026-03-15",
  period_end: "2026-06-15",
};

describe("computeMatch", () => {
  it("returns 100 for a perfect match", () => {
    const result = computeMatch(baseStudent, baseInternship);
    expect(result.score).toBe(100);
    expect(result.reasons).toHaveLength(4);
  });

  it("returns 0 for no overlap at all", () => {
    const student: StudentData = {
      track: "UX",
      city: "Malmö",
      skills: ["Figma"],
      availability_periods: [{ start: "2025-01-01", end: "2025-03-01" }],
    };
    const internship: InternshipData = {
      track_focus: "MLOps",
      skills: ["Python", "Docker"],
      city: "Göteborg",
      period_start: "2026-09-01",
      period_end: "2026-12-01",
    };
    const result = computeMatch(student, internship);
    expect(result.score).toBe(0);
  });

  it("gives 35 track points for exact match", () => {
    const result = computeMatch(baseStudent, baseInternship);
    const trackReason = result.reasons.find((r) => r.key === "track");
    expect(trackReason?.points).toBe(35);
    expect(trackReason?.label).toBe("track_exact");
  });

  it("gives partial track points for related tracks", () => {
    const student = { ...baseStudent, track: "Frontend" };
    const internship = { ...baseInternship, track_focus: "Fullstack" };
    const result = computeMatch(student, internship);
    const trackReason = result.reasons.find((r) => r.key === "track");
    expect(trackReason!.points).toBeGreaterThan(0);
    expect(trackReason?.label).toBe("track_related");
  });

  it("gives 20 city points for exact city match", () => {
    const result = computeMatch(baseStudent, baseInternship);
    const cityReason = result.reasons.find((r) => r.key === "city");
    expect(cityReason?.points).toBe(20);
    expect(cityReason?.label).toBe("city_exact");
  });

  it("gives 15 city points when one is remote", () => {
    const student = { ...baseStudent, city: "Remote" };
    const result = computeMatch(student, baseInternship);
    const cityReason = result.reasons.find((r) => r.key === "city");
    expect(cityReason?.points).toBe(15);
  });

  it("gives 10 city points for same region", () => {
    const student = { ...baseStudent, city: "Solna" };
    const result = computeMatch(student, baseInternship);
    const cityReason = result.reasons.find((r) => r.key === "city");
    expect(cityReason?.points).toBe(10);
    expect(cityReason?.label).toBe("city_region");
  });

  it("gives full period points for full containment", () => {
    const result = computeMatch(baseStudent, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason?.points).toBe(10);
    expect(periodReason?.label).toBe("period_full");
  });

  it("gives partial period points for partial overlap", () => {
    const student: StudentData = {
      ...baseStudent,
      availability_periods: [{ start: "2026-05-01", end: "2026-08-01" }],
    };
    const result = computeMatch(student, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason?.points).toBe(5);
    expect(periodReason?.label).toBe("period_partial");
  });

  it("gives zero period points when no overlap", () => {
    const student: StudentData = {
      ...baseStudent,
      availability_periods: [{ start: "2025-01-01", end: "2025-03-01" }],
    };
    const result = computeMatch(student, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason?.points).toBe(0);
  });

  it("respects custom weights", () => {
    const weights = { track: 80, skills: 0, city: 0, period: 0 };
    const result = computeMatch(baseStudent, baseInternship, weights);
    // Track is exact match, so should get high score
    expect(result.score).toBeGreaterThan(70);
  });

  it("handles empty skills gracefully", () => {
    const internship = { ...baseInternship, skills: [] };
    const result = computeMatch(baseStudent, internship);
    const skillsReason = result.reasons.find((r) => r.key === "skills");
    expect(skillsReason?.points).toBe(0);
  });

  it("handles empty availability periods", () => {
    const student = { ...baseStudent, availability_periods: [] };
    const result = computeMatch(student, baseInternship);
    const periodReason = result.reasons.find((r) => r.key === "period");
    expect(periodReason?.points).toBe(0);
  });

  it("score is always between 0 and 100", () => {
    const weights = { track: 100, skills: 100, city: 100, period: 100 };
    const result = computeMatch(baseStudent, baseInternship, weights);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
