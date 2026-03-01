import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const applySchema = z.object({
  internship_id: z.string().uuid(),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Student: own applications
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role === "student") {
    const { data, error } = await supabase
      .from("applications")
      .select("*, internships(title, city, company_profiles!internships_company_user_id_fkey(company_name))")
      .eq("student_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Company: applications for company's internships
  if (userData?.role === "company") {
    const { data: internships } = await supabase
      .from("internships")
      .select("id")
      .eq("company_user_id", user.id);

    if (!internships || internships.length === 0) return NextResponse.json([]);

    const ids = internships.map((i) => i.id);
    const { data, error } = await supabase
      .from("applications")
      .select("*, student_profiles!applications_student_user_id_fkey(first_name, last_name, track, city), internships(title)")
      .in("internship_id", ids)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      internship_id: parsed.data.internship_id,
      student_user_id: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already applied" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
