import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, validateOrigin } from "@/lib/api-helpers";

const applySchema = z.object({
  internship_id: z.string().uuid(),
});

const statusSchema = z.object({
  application_id: z.string().uuid(),
  status: z.enum(["pending", "viewed", "contacted", "rejected", "accepted"]),
});

export async function GET(request: NextRequest) {
  const rl = rateLimit(request);
  if (rl) return rl;

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
  const rl = rateLimit(request, { limit: 30 });
  if (rl) return rl;
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

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

  // Notify company about new application
  const { data: internshipInfo } = await supabase
    .from("internships")
    .select("company_user_id, title")
    .eq("id", parsed.data.internship_id)
    .single();
  if (internshipInfo) {
    await supabase.from("notifications").insert({
      user_id: internshipInfo.company_user_id,
      type: "new_application",
      title: "Ny ansökan",
      body: `En student har visat intresse för "${internshipInfo.title}".`,
      related_id: data.id,
    });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const rl = rateLimit(request, { limit: 30 });
  if (rl) return rl;
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify the application belongs to one of the company's internships
  const { data: app } = await supabase
    .from("applications")
    .select("internship_id, student_user_id")
    .eq("id", parsed.data.application_id)
    .single();

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: internship } = await supabase
    .from("internships")
    .select("company_user_id, title")
    .eq("id", app.internship_id)
    .single();

  if (!internship || internship.company_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("applications")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.application_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create notification for the student about status change
  const statusLabels: Record<string, string> = {
    viewed: "Visad",
    contacted: "Kontaktad",
    accepted: "Godkänd",
    rejected: "Nekad",
  };
  if (parsed.data.status !== "pending") {
    await supabase.from("notifications").insert({
      user_id: app.student_user_id,
      type: "status_change",
      title: `Ansökan uppdaterad: ${statusLabels[parsed.data.status] ?? parsed.data.status}`,
      body: `Din ansökan till "${internship.title}" har ändrat status.`,
      related_id: parsed.data.application_id,
    });
  }

  return NextResponse.json(data);
}
