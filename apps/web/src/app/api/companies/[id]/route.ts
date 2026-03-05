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

  // Check caller's role — only students (or admins) may view company detail
  const { data: caller } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role === "company") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch company profile (must be visible)
  const { data: company, error } = await supabase
    .from("company_profiles")
    .select("user_id, company_name, city, website, description, vision, looking_for, visible, updated_at")
    .eq("user_id", id)
    .eq("visible", true)
    .single();

  if (error || !company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch internships for this company
  const { data: internships } = await supabase
    .from("internships")
    .select("id, title, city, track_focus, seats, period_start, period_end")
    .eq("company_user_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ...company, internships: internships ?? [] });
}
