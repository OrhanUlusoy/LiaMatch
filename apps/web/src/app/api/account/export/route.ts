import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 5, windowMs: 60_000 });
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather all user data
  const [
    { data: userRecord },
    { data: studentProfile },
    { data: companyProfile },
    { data: internships },
    { data: applications },
    { data: messages },
    { data: notifications },
    { data: savedInternships },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("student_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("company_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("internships").select("*").eq("company_id", user.id),
    supabase.from("applications").select("*").eq("student_id", user.id),
    supabase.from("messages").select("*").eq("sender_id", user.id),
    supabase.from("notifications").select("*").eq("user_id", user.id),
    supabase.from("saved_internships").select("*").eq("user_id", user.id),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      createdAt: user.created_at,
    },
    userRecord,
    studentProfile,
    companyProfile,
    internships: internships ?? [],
    applications: applications ?? [],
    messagesSent: messages ?? [],
    notifications: notifications ?? [],
    savedInternships: savedInternships ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="liamatch-data-${user.id}.json"`,
    },
  });
}
