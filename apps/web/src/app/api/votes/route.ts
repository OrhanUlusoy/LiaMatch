import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, validateOrigin } from "@/lib/api-helpers";

const voteSchema = z.object({
  choice: z.enum(["interested", "needs_more", "not_for_me"]),
  role: z.enum(["employer", "student"]),
  fingerprint: z.string().min(8).max(128),
  user_agent: z.string().max(512).optional(),
  page_url: z.string().max(256).optional(),
});

const visitSchema = z.object({
  fingerprint: z.string().min(8).max(128),
});

const commentSchema = z.object({
  fingerprint: z.string().min(8).max(128),
  comment: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { limit: 10 });
  if (rl) return rl;
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const body = await request.json();

  // Track visit (separate action)
  if (body.action === "visit") {
    const parsed = visitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    await supabase
      .from("feedback_visitors")
      .upsert({ fingerprint: parsed.data.fingerprint }, { onConflict: "fingerprint" });
    return NextResponse.json({ ok: true });
  }

  // Add comment to existing vote
  if (body.action === "comment") {
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    await supabase
      .from("feedback_votes")
      .update({ comment: parsed.data.comment })
      .eq("fingerprint", parsed.data.fingerprint);
    return NextResponse.json({ ok: true });
  }

  // Cast vote
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("feedback_votes")
    .upsert(
      {
        choice: parsed.data.choice,
        role: parsed.data.role,
        fingerprint: parsed.data.fingerprint,
        user_agent: parsed.data.user_agent ?? null,
        page_url: parsed.data.page_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fingerprint" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type RoleCounts = { interested: number; needs_more: number; not_for_me: number; total: number };

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 30, windowMs: 60_000 });
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();

  const [votesRes, visitorsRes] = await Promise.all([
    supabase.from("feedback_votes").select("choice, role"),
    supabase.from("feedback_visitors").select("id", { count: "exact", head: true }),
  ]);

  if (votesRes.error) {
    return NextResponse.json({ error: votesRes.error.message }, { status: 500 });
  }

  const empty = (): RoleCounts => ({ interested: 0, needs_more: 0, not_for_me: 0, total: 0 });
  const student = empty();
  const employer = empty();

  for (const row of votesRes.data ?? []) {
    const bucket = row.role === "employer" ? employer : student;
    const key = row.choice as keyof RoleCounts;
    if (key in bucket && key !== "total") (bucket[key] as number)++;
    bucket.total++;
  }

  return NextResponse.json({
    student,
    employer,
    total: student.total + employer.total,
    visitors: visitorsRes.count ?? 0,
  });
}
