import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 10, windowMs: 60_000 });
  if (rl) return rl;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Gather all data in parallel
  const [usersRes, studentsRes, companiesRes, internshipsRes, applicationsRes, messagesRes, notificationsRes] =
    await Promise.all([
      admin.from("users").select("id, role, created_at"),
      admin.from("student_profiles").select("user_id, track, city, created_at"),
      admin.from("company_profiles").select("user_id, city, created_at"),
      admin.from("internships").select("id, track_focus, city, seats, created_at"),
      admin.from("applications").select("id, status, created_at"),
      admin.from("messages").select("id, created_at"),
      admin.from("notifications").select("id, created_at"),
    ]);

  const users = usersRes.data ?? [];
  const students = studentsRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const internships = internshipsRes.data ?? [];
  const applications = applicationsRes.data ?? [];
  const messages = messagesRes.data ?? [];
  const notifications = notificationsRes.data ?? [];

  // --- Totals ---
  const totals = {
    users: users.length,
    students: users.filter((u) => u.role === "student").length,
    companies: users.filter((u) => u.role === "company").length,
    internships: internships.length,
    totalSeats: internships.reduce((s, i) => s + (i.seats ?? 0), 0),
    applications: applications.length,
    messages: messages.length,
  };

  // --- Application status breakdown ---
  const statusBreakdown: Record<string, number> = {};
  for (const a of applications) {
    statusBreakdown[a.status] = (statusBreakdown[a.status] ?? 0) + 1;
  }

  // --- Registrations per week (last 12 weeks) ---
  const registrationsPerWeek = weeklyBuckets(
    users.map((u) => u.created_at),
    12,
  );

  // --- Applications per week (last 12 weeks) ---
  const applicationsPerWeek = weeklyBuckets(
    applications.map((a) => a.created_at),
    12,
  );

  // --- Popular tracks ---
  const trackCounts: Record<string, number> = {};
  for (const s of students) {
    if (s.track) trackCounts[s.track] = (trackCounts[s.track] ?? 0) + 1;
  }
  const popularTracks = Object.entries(trackCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([track, count]) => ({ track, count }));

  // --- Popular cities ---
  const cityCounts: Record<string, number> = {};
  for (const s of students) {
    if (s.city) cityCounts[s.city] = (cityCounts[s.city] ?? 0) + 1;
  }
  for (const c of companies) {
    if (c.city) cityCounts[c.city] = (cityCounts[c.city] ?? 0) + 1;
  }
  const popularCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  return NextResponse.json({
    totals,
    statusBreakdown,
    registrationsPerWeek,
    applicationsPerWeek,
    popularTracks,
    popularCities,
  });
}

/** Group ISO timestamps into weekly buckets for the last N weeks. */
function weeklyBuckets(dates: string[], weeks: number) {
  const now = new Date();
  const buckets: { week: string; count: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7);
    start.setHours(0, 0, 0, 0);
    // Set to Monday
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const count = dates.filter((d) => {
      const dt = new Date(d);
      return dt >= start && dt < end;
    }).length;

    buckets.push({
      week: start.toISOString().slice(0, 10),
      count,
    });
  }

  return buckets;
}
