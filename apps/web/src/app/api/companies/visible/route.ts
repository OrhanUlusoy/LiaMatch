import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get visible companies with their open seats count
  const { data: companies, error: compError } = await supabase
    .from("company_profiles")
    .select("user_id, company_name, city, website")
    .eq("visible", true)
    .order("updated_at", { ascending: false });

  if (compError) return NextResponse.json({ error: compError.message }, { status: 500 });

  if (!companies || companies.length === 0) return NextResponse.json([]);

  // Get seat counts from internships for each visible company
  const companyIds = companies.map((c) => c.user_id);
  const { data: internships } = await supabase
    .from("internships")
    .select("company_user_id, seats")
    .in("company_user_id", companyIds);

  const seatMap: Record<string, number> = {};
  for (const i of internships ?? []) {
    seatMap[i.company_user_id] = (seatMap[i.company_user_id] ?? 0) + i.seats;
  }

  const result = companies.map((c) => ({
    ...c,
    open_seats: seatMap[c.user_id] ?? 0,
  }));

  return NextResponse.json(result);
}
