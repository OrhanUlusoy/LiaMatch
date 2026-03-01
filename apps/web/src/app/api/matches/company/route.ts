import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeMatch, type StudentData, type InternshipData } from "@/lib/matching/score";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const internshipId = searchParams.get("internship_id");

  if (!internshipId) {
    return NextResponse.json({ error: "internship_id required" }, { status: 400 });
  }

  // Verify internship belongs to this company
  const { data: internship } = await supabase
    .from("internships")
    .select("*")
    .eq("id", internshipId)
    .eq("company_user_id", user.id)
    .single();

  if (!internship) {
    return NextResponse.json({ error: "Internship not found" }, { status: 404 });
  }

  // Fetch all student profiles
  const { data: students } = await supabase.from("student_profiles").select("*");

  if (!students) {
    return NextResponse.json([]);
  }

  const internData: InternshipData = {
    track_focus: internship.track_focus,
    skills: Array.isArray(internship.skills) ? internship.skills : [],
    city: internship.city,
    period_start: internship.period_start,
    period_end: internship.period_end,
  };

  const results = students.map((s) => {
    const student: StudentData = {
      track: s.track,
      city: s.city,
      availability_periods: s.availability_periods ?? [],
    };
    const match = computeMatch(student, internData);
    return { student: { ...s, cv_file_url: undefined, pb_file_url: undefined }, ...match };
  });

  results.sort((a, b) => b.score - a.score);

  return NextResponse.json(results);
}
