import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeMatch, type StudentData, type InternshipData } from "@/lib/matching/score";

/**
 * Returns top-3 suggested companies (with their best internship match)
 * for the currently logged-in student.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("student_profiles")
    .select("track, city, availability_periods")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json([]);

  // Get visible companies + their internships
  const { data: companies } = await supabase
    .from("company_profiles")
    .select("user_id, company_name, city")
    .eq("visible", true);

  if (!companies || companies.length === 0) return NextResponse.json([]);

  const companyIds = companies.map((c) => c.user_id);
  const { data: internships } = await supabase
    .from("internships")
    .select("id, company_user_id, title, city, track_focus, skills, period_start, period_end")
    .in("company_user_id", companyIds);

  const student: StudentData = {
    track: profile.track,
    city: profile.city,
    availability_periods: profile.availability_periods ?? [],
  };

  // For each company, find the best matching internship
  const companyScores = companies.map((c) => {
    const companyInterns = (internships ?? []).filter((i) => i.company_user_id === c.user_id);
    let bestScore = 0;
    let bestTitle = "";

    for (const intern of companyInterns) {
      const internData: InternshipData = {
        track_focus: intern.track_focus,
        skills: Array.isArray(intern.skills) ? intern.skills : [],
        city: intern.city,
        period_start: intern.period_start,
        period_end: intern.period_end,
      };
      const match = computeMatch(student, internData);
      if (match.score > bestScore) {
        bestScore = match.score;
        bestTitle = intern.title;
      }
    }

    return {
      user_id: c.user_id,
      company_name: c.company_name,
      city: c.city,
      score: bestScore,
      bestListing: bestTitle,
    };
  });

  companyScores.sort((a, b) => b.score - a.score);

  return NextResponse.json(companyScores.slice(0, 3));
}
