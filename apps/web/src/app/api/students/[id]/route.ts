import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, isValidUUID } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = rateLimit(request);
  if (rl) return rl;

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only companies and admins can view student profiles
  const { data: caller } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role === "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only allow viewing students who are open_for_lia
  const { data, error } = await supabase
    .from("student_profiles")
    .select(
      "user_id, first_name, last_name, track, school, city, skills, github_url, linkedin_url, project_title, project_desc, project_url, availability_periods, cv_file_url, pb_file_url, open_for_lia, updated_at",
    )
    .eq("user_id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!data.open_for_lia) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
