import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeMatch, type StudentData, type InternshipData } from "@/lib/matching/score";

export async function GET() {
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
    .select("track, city, availability_periods")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

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
    const match = computeMatch(student, internData);
    return { internship: intern, ...match };
  });

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json(results);
}
