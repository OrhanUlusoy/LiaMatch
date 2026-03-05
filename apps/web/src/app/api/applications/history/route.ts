import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = request.nextUrl.searchParams.get("application_id");
  if (!applicationId) {
    return NextResponse.json({ error: "Missing application_id" }, { status: 400 });
  }

  // Verify the caller owns this application (student) or the related internship (company)
  const { data: app } = await supabase
    .from("applications")
    .select("student_user_id, internship_id")
    .eq("id", applicationId)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (app.student_user_id !== user.id) {
    const { data: internship } = await supabase
      .from("internships")
      .select("company_user_id")
      .eq("id", app.internship_id)
      .single();

    if (!internship || internship.company_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("application_status_history")
    .select("id, old_status, new_status, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
