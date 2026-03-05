import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [students, companies, internships, applications] = await Promise.all([
    supabase.from("student_profiles").select("*", { count: "exact", head: true }),
    supabase.from("company_profiles").select("*", { count: "exact", head: true }),
    supabase.from("internships").select("*", { count: "exact", head: true }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    students: students.count ?? 0,
    companies: companies.count ?? 0,
    internships: internships.count ?? 0,
    applications: applications.count ?? 0,
  });
}
