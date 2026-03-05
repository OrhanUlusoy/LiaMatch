import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeMatch, type StudentData, type InternshipData } from "@/lib/matching/score";

/**
 * Returns top-3 suggested students for the currently logged-in company.
 * Match is based on the company's internships.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get company's internships
  const { data: internships } = await supabase
    .from("internships")
    .select("id, title, city, track_focus, skills, period_start, period_end")
    .eq("company_user_id", user.id);

  if (!internships || internships.length === 0) return NextResponse.json([]);

  // Get students open for LIA
  const { data: students } = await supabase
    .from("student_profiles")
    .select("user_id, first_name, last_name, track, city, availability_periods")
    .eq("open_for_lia", true);

  if (!students || students.length === 0) return NextResponse.json([]);

  // For each student, find the best matching internship score
  const studentScores = students.map((s) => {
    const studentData: StudentData = {
      track: s.track,
      city: s.city,
      availability_periods: s.availability_periods ?? [],
    };

    let bestScore = 0;
    let bestListing = "";

    for (const intern of internships) {
      const internData: InternshipData = {
        track_focus: intern.track_focus,
        skills: Array.isArray(intern.skills) ? intern.skills : [],
        city: intern.city,
        period_start: intern.period_start,
        period_end: intern.period_end,
      };
      const match = computeMatch(studentData, internData);
      if (match.score > bestScore) {
        bestScore = match.score;
        bestListing = intern.title;
      }
    }

    return {
      user_id: s.user_id,
      first_name: s.first_name,
      last_name: s.last_name,
      track: s.track,
      city: s.city,
      score: bestScore,
      bestListing,
    };
  });

  studentScores.sort((a, b) => b.score - a.score);

  return NextResponse.json(studentScores.slice(0, 3));
}
