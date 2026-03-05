import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, validateOrigin } from "@/lib/api-helpers";
import { env } from "@/lib/env";

export async function DELETE(request: NextRequest) {
  const rl = rateLimit(request, { limit: 3, windowMs: 60_000 });
  if (rl) return rl;

  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // Verify user is authenticated
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 },
    );
  }

  // Use service_role client to delete all user data
  const adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Delete files from storage (documents bucket)
  const { data: files } = await adminClient.storage
    .from("documents")
    .list(user.id);

  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`);
    await adminClient.storage.from("documents").remove(paths);
  }

  // Call the cascade delete function
  const { error } = await adminClient.rpc("delete_user_data", {
    target_user_id: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
