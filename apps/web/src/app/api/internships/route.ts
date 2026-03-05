import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, validateOrigin } from "@/lib/api-helpers";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  city: z.string().min(1).max(100),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  application_start: z.string().optional(),
  application_end: z.string().optional(),
  seats: z.number().int().min(1).default(1),
  track_focus: z.string().min(1).max(200),
  skills: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const rl = rateLimit(request);
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from("internships")
    .select("*, company_profiles!internships_company_user_id_fkey(company_name)")
    .order("created_at", { ascending: false });

  const city = searchParams.get("city");
  const track = searchParams.get("track");
  if (city) query = query.ilike("city", `%${city}%`);
  if (track) query = query.ilike("track_focus", `%${track}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { limit: 20 });
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: inserted, error } = await supabase
    .from("internships")
    .insert({
      company_user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(inserted, { status: 201 });
}
