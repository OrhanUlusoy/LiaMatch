/**
 * LiaMatch scoring algorithm.
 *
 * Score 0–100 composed of:
 *   - Track match:   0–35  (exact = 35, partial/related = 20, none = 0)
 *   - Skills overlap: 0–35  (Jaccard-inspired)
 *   - City match:     0–20  (exact = 20, same region = 10, none = 0)
 *   - Period overlap:  0–10  (full = 10, partial = 5, none = 0)
 */

export type Reason = { key: string; label: string; points: number };

export type MatchResult = {
  score: number;
  reasons: Reason[];
};

// ----- Track -----

const TRACK_ALIASES: Record<string, string[]> = {
  mlops: ["ml", "machine learning", "devops", "data engineering", "mlops"],
  webbutveckling: ["web", "frontend", "backend", "fullstack", "webbutveckling"],
  data: ["data", "data science", "analytics", "bi", "data engineering"],
  devops: ["devops", "cloud", "sre", "mlops"],
  ux: ["ux", "ui", "design"],
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function trackScore(studentTrack: string, internshipTrack: string): { points: number; reason: string } {
  const a = normalize(studentTrack);
  const b = normalize(internshipTrack);

  if (a === b) return { points: 35, reason: "track_exact" };

  const aAliases = Object.values(TRACK_ALIASES).find((arr) => arr.includes(a)) ?? [a];
  const bAliases = Object.values(TRACK_ALIASES).find((arr) => arr.includes(b)) ?? [b];

  const overlap = aAliases.some((e) => bAliases.includes(e));
  if (overlap) return { points: 20, reason: "track_related" };

  return { points: 0, reason: "track_none" };
}

// ----- Skills -----

function skillsScore(studentTrack: string, internshipSkills: string[]): { points: number; reason: string; matched: number; total: number } {
  if (internshipSkills.length === 0) return { points: 0, reason: "skills_none", matched: 0, total: 0 };

  const sNorm = normalize(studentTrack);
  const sAliases = Object.values(TRACK_ALIASES).find((arr) => arr.includes(sNorm)) ?? [sNorm];

  const iNorm = internshipSkills.map(normalize);
  const matched = iNorm.filter((s) => sAliases.includes(s)).length;
  const total = iNorm.length;
  const ratio = total > 0 ? matched / total : 0;
  const points = Math.round(ratio * 35);

  return { points, reason: `skills_${matched}/${total}`, matched, total };
}

// ----- City -----

const REGIONS: Record<string, string[]> = {
  stockholm: ["stockholm", "solna", "sundbyberg", "nacka", "kista"],
  göteborg: ["göteborg", "gothenburg", "mölndal"],
  malmö: ["malmö", "lund"],
};

function cityScore(studentCity: string, internshipCity: string): { points: number; reason: string } {
  const a = normalize(studentCity);
  const b = normalize(internshipCity);

  if (a === b) return { points: 20, reason: "city_exact" };

  if (b === "remote" || a === "remote") return { points: 15, reason: "city_remote" };

  const aRegion = Object.entries(REGIONS).find(([, cities]) => cities.includes(a));
  const bRegion = Object.entries(REGIONS).find(([, cities]) => cities.includes(b));

  if (aRegion && bRegion && aRegion[0] === bRegion[0]) return { points: 10, reason: "city_region" };

  return { points: 0, reason: "city_none" };
}

// ----- Period -----

type Period = { start: string; end: string };

function periodsOverlap(studentPeriods: Period[], iStart?: string | null, iEnd?: string | null): { points: number; reason: string } {
  if (!iStart || !iEnd || studentPeriods.length === 0) return { points: 0, reason: "period_unknown" };

  const internStart = new Date(iStart).getTime();
  const internEnd = new Date(iEnd).getTime();

  for (const p of studentPeriods) {
    if (!p.start || !p.end) continue;
    const sStart = new Date(p.start).getTime();
    const sEnd = new Date(p.end).getTime();

    // Full containment
    if (sStart <= internStart && sEnd >= internEnd) return { points: 10, reason: "period_full" };

    // Partial overlap
    if (sStart <= internEnd && sEnd >= internStart) return { points: 5, reason: "period_partial" };
  }

  return { points: 0, reason: "period_none" };
}

// ----- Public API -----

export type StudentData = {
  track: string;
  city: string;
  availability_periods: Period[];
};

export type InternshipData = {
  track_focus: string;
  skills: string[];
  city: string;
  period_start?: string | null;
  period_end?: string | null;
};

export function computeMatch(student: StudentData, internship: InternshipData): MatchResult {
  const reasons: Reason[] = [];

  const track = trackScore(student.track, internship.track_focus);
  reasons.push({ key: "track", label: track.reason, points: track.points });

  const skills = skillsScore(student.track, internship.skills);
  reasons.push({ key: "skills", label: skills.reason, points: skills.points });

  const city = cityScore(student.city, internship.city);
  reasons.push({ key: "city", label: city.reason, points: city.points });

  const period = periodsOverlap(student.availability_periods, internship.period_start, internship.period_end);
  reasons.push({ key: "period", label: period.reason, points: period.points });

  const score = track.points + skills.points + city.points + period.points;
  return { score: Math.min(score, 100), reasons };
}
