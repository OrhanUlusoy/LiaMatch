import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api-helpers";

/**
 * GET /api/admin/feedback/analytics
 * Returns detailed feedback analytics for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 20, windowMs: 60_000 });
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all votes + visitor count in parallel
  const [votesRes, visitorsRes] = await Promise.all([
    supabase
      .from("feedback_votes")
      .select("choice, role, comment, user_agent, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase.from("feedback_visitors").select("id, created_at").order("created_at", { ascending: true }),
  ]);

  if (votesRes.error) {
    return NextResponse.json({ error: votesRes.error.message }, { status: 500 });
  }

  const votes = votesRes.data ?? [];
  const visitors = visitorsRes.data ?? [];

  // ── Totals by role + choice ──
  const totals = {
    all: { interested: 0, needs_more: 0, not_for_me: 0, total: 0 },
    student: { interested: 0, needs_more: 0, not_for_me: 0, total: 0 },
    employer: { interested: 0, needs_more: 0, not_for_me: 0, total: 0 },
  };

  for (const v of votes) {
    const role = v.role === "employer" ? "employer" : "student";
    const choice = v.choice as "interested" | "needs_more" | "not_for_me";
    if (choice in totals.all) {
      totals.all[choice]++;
      totals[role][choice]++;
    }
    totals.all.total++;
    totals[role].total++;
  }

  // ── Comments (most recent first) ──
  const comments = votes
    .filter((v) => v.comment)
    .map((v) => ({
      comment: v.comment,
      role: v.role,
      choice: v.choice,
      created_at: v.created_at,
    }))
    .reverse();

  // ── Votes per week (last 12 weeks) ──
  const votesPerWeek = weeklyBuckets(
    votes.map((v) => v.created_at),
    12,
  );

  // ── Visitors per week (last 12 weeks) ──
  const visitorsPerWeek = weeklyBuckets(
    visitors.map((v) => v.created_at),
    12,
  );

  // ── Conversion rate: votes / visitors ──
  const conversionRate =
    visitors.length > 0 ? Math.round((votes.length / visitors.length) * 100) : 0;

  // ── Satisfaction score (0-100): interested=100, needs_more=50, not_for_me=0 ──
  const satisfactionScore =
    votes.length > 0
      ? Math.round(
          ((totals.all.interested * 100 + totals.all.needs_more * 50) / votes.length),
        )
      : 0;

  // ── Device breakdown from user_agent ──
  const devices = { mobile: 0, desktop: 0, unknown: 0 };
  for (const v of votes) {
    if (!v.user_agent) {
      devices.unknown++;
    } else if (/mobile|android|iphone|ipad/i.test(v.user_agent)) {
      devices.mobile++;
    } else {
      devices.desktop++;
    }
  }

  // ── Comment rate ──
  const commentCount = comments.length;
  const commentRate = votes.length > 0 ? Math.round((commentCount / votes.length) * 100) : 0;

  return NextResponse.json({
    totals,
    comments,
    votesPerWeek,
    visitorsPerWeek,
    conversionRate,
    satisfactionScore,
    devices,
    commentCount,
    commentRate,
    totalVotes: votes.length,
    totalVisitors: visitors.length,
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
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const count = dates.filter((d) => {
      const dt = new Date(d);
      return dt >= start && dt < end;
    }).length;

    buckets.push({ week: start.toISOString().slice(0, 10), count });
  }

  return buckets;
}
