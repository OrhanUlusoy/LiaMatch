import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { rateLimit, validateOrigin, isValidUUID } from "@/lib/api-helpers";

const sendSchema = z.object({
  receiver_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function GET(request: NextRequest) {
  const rl = rateLimit(request);
  if (rl) return rl;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const withUser = searchParams.get("with");

  if (withUser) {
    // Validate UUID to prevent query injection
    if (!isValidUUID(withUser)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    // Get conversation with a specific user
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUser}),and(sender_id.eq.${withUser},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark received messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", withUser)
      .eq("receiver_id", user.id)
      .eq("read", false);

    return NextResponse.json(data ?? []);
  }

  // Get all conversations (latest message per conversation partner)
  const { data: sent } = await supabase
    .from("messages")
    .select("*")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false });

  const { data: received } = await supabase
    .from("messages")
    .select("*")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false });

  const all = [...(sent ?? []), ...(received ?? [])];

  // Group by conversation partner
  const convMap = new Map<string, { partnerId: string; lastMessage: typeof all[0]; unread: number }>();
  for (const msg of all) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    const existing = convMap.get(partnerId);
    if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
      convMap.set(partnerId, {
        partnerId,
        lastMessage: msg,
        unread: (existing?.unread ?? 0) + (msg.receiver_id === user.id && !msg.read ? 1 : 0),
      });
    } else if (msg.receiver_id === user.id && !msg.read) {
      existing.unread++;
    }
  }

  // Get partner names
  const partnerIds = [...convMap.keys()];
  const conversations = [];

  if (partnerIds.length > 0) {
    const { data: students } = await supabase
      .from("student_profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", partnerIds);

    const { data: companies } = await supabase
      .from("company_profiles")
      .select("user_id, company_name")
      .in("user_id", partnerIds);

    const nameMap = new Map<string, string>();
    for (const s of students ?? []) nameMap.set(s.user_id, `${s.first_name} ${s.last_name}`);
    for (const c of companies ?? []) nameMap.set(c.user_id, c.company_name);

    for (const [pid, conv] of convMap) {
      conversations.push({
        partnerId: pid,
        partnerName: nameMap.get(pid) ?? "Användare",
        lastMessage: conv.lastMessage.content,
        lastAt: conv.lastMessage.created_at,
        unread: conv.unread,
      });
    }
  }

  conversations.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  return NextResponse.json(conversations);
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { limit: 30 });
  if (rl) return rl;
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: parsed.data.receiver_id,
      content: parsed.data.content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify receiver
  await supabase.from("notifications").insert({
    user_id: parsed.data.receiver_id,
    type: "new_message",
    title: "Nytt meddelande",
    body: parsed.data.content.slice(0, 100),
    related_id: data.id,
  });

  return NextResponse.json(data, { status: 201 });
}
