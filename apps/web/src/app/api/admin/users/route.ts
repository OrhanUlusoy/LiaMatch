import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { limit: 20 });
  if (rl) return rl;

  // 1. Verify caller is admin
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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

  // 2. Use service role to read all users + profiles
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch auth users with pagination
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const perPage = Math.min(parseInt(request.nextUrl.searchParams.get("per_page") ?? "50"), 100);
  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({ page, perPage });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Fetch public.users (role) + student_profiles + company_profiles
  const [usersRes, studentsRes, companiesRes] = await Promise.all([
    adminClient.from("users").select("id, email, role, created_at"),
    adminClient.from("student_profiles").select("user_id, first_name, last_name, track, school, city"),
    adminClient.from("company_profiles").select("user_id, company_name, city"),
  ]);

  // Build lookup maps
  const roleMap = new Map((usersRes.data ?? []).map((u) => [u.id, u.role]));
  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.user_id, s]));
  const companyMap = new Map((companiesRes.data ?? []).map((c) => [c.user_id, c]));

  // Merge into a single list
  const result = authData.users.map((au) => ({
    id: au.id,
    email: au.email,
    role: roleMap.get(au.id) ?? null,
    created_at: au.created_at,
    last_sign_in: au.last_sign_in_at ?? null,
    student: studentMap.get(au.id) ?? null,
    company: companyMap.get(au.id) ?? null,
  }));

  // Sort newest first
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ users: result, total: result.length });
}
