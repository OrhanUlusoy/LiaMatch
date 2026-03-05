import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeMatch, DEFAULT_WEIGHTS, type StudentData, type InternshipData, type MatchWeights } from "@/lib/matching/score";
import { rateLimit } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request);
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("track, city, skills, availability_periods, match_weights")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Parse optional weight overrides from profile or query params
  const sp = request.nextUrl.searchParams;
  const weights: Partial<MatchWeights> = {};
  for (const k of ["track", "skills", "city", "period"] as const) {
    const v = sp.get(`w_${k}`);
    if (v) {
      const n = Number(v);
      if (!Number.isNaN(n)) weights[k] = Math.max(0, Math.min(100, n));
    }
  }
  // Merge with saved profile weights
  const savedWeights = (profile as Record<string, unknown>).match_weights as Partial<MatchWeights> | null;
  const finalWeights = { ...DEFAULT_WEIGHTS, ...savedWeights, ...weights };

  // Fetch all internships
  const { data: internships } = await supabase
    .from("internships")
    .select("*, company_profiles!internships_company_user_id_fkey(company_name)")
    .order("created_at", { ascending: false });

  if (!internships) {
    return NextResponse.json([]);
  }

  const student: StudentData = {
    track: profile.track,
    city: profile.city,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    availability_periods: profile.availability_periods ?? [],
  };

  const results = internships.map((intern) => {
    const internData: InternshipData = {
      track_focus: intern.track_focus,
      skills: Array.isArray(intern.skills) ? intern.skills : [],
      city: intern.city,
      period_start: intern.period_start,
      period_end: intern.period_end,
    };
    const match = computeMatch(student, internData, finalWeights);
    return { internship: intern, ...match };
  });

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json(results);
}
