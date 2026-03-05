import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit, validateOrigin } from "@/lib/api-helpers";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Email notification sender.
 * Uses Supabase service role to verify the caller is admin or the system trigger.
 * Integrates with an external email service (Resend, SendGrid, etc.)
 * when EMAIL_API_KEY is configured.
 *
 * POST /api/notifications/email
 * Body: { user_id, subject, body }
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { limit: 10, windowMs: 3600_000 });
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

  // Only admins can trigger email notifications
  const { data: caller } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (caller?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user_id, subject, body } = await request.json();
  if (!user_id || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Fetch user email
  const { data: targetUser } = await supabase
    .from("users")
    .select("email")
    .eq("id", user_id)
    .single();

  if (!targetUser?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const emailApiKey = process.env.EMAIL_API_KEY;
  if (!emailApiKey) {
    // Log but don't fail — email service not configured yet
    console.log(`[Email] Would send to ${targetUser.email}: ${subject}`);
    return NextResponse.json({ sent: false, reason: "EMAIL_API_KEY not configured" });
  }

  // Example Resend integration (swap for your provider)
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "LiaMatch <noreply@liamatch.se>",
        to: targetUser.email,
        subject,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(body)}</p><hr/><p style="color:#888;font-size:12px;">LiaMatch — LIA-matchning för studenter och företag</p></div>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }
}
