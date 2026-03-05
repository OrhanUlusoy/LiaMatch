"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Conversation = {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export default function MessagesPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(searchParams.get("with"));
  const [selectedName, setSelectedName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
      setLoading(false);
    })();
  }, [supabase, router]);

  useEffect(() => {
    if (!selectedPartner) return;
    (async () => {
      const res = await fetch(`/api/messages?with=${selectedPartner}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    })();

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`chat-${selectedPartner}`)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${selectedPartner}`,
        },
        (payload: { new: Message }) => {
          if (payload.new.receiver_id === userId) {
            setMessages(prev => [...prev, payload.new]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedPartner, supabase, userId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !selectedPartner) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: selectedPartner, content: newMsg.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMsg("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function selectConversation(partnerId: string, partnerName: string) {
    setSelectedPartner(partnerId);
    setSelectedName(partnerName);
  }

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("messages.title")}</h1>

      <div className="grid gap-4 md:grid-cols-3" style={{ minHeight: "60vh" }}>
        {/* Conversation list */}
        <div className="space-y-2 md:col-span-1">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">{t("messages.noConversations")}</p>
          )}
          {conversations.map(c => (
            <button
              key={c.partnerId}
              type="button"
              onClick={() => selectConversation(c.partnerId, c.partnerName)}
              className={cn(
                "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary",
                selectedPartner === c.partnerId && "border-primary bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{c.partnerName}</span>
                {c.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{c.lastMessage}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(c.lastAt).toLocaleString("sv-SE")}
              </p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <Card className="md:col-span-2">
          <CardContent className="flex h-full flex-col p-4">
            {selectedPartner ? (
              <>
                <div className="mb-3 border-b border-border pb-2">
                  <p className="text-sm font-medium">{selectedName || selectedPartner}</p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        m.sender_id === userId
                          ? "ml-auto bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={cn("mt-1 text-[10px]", m.sender_id === userId ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(m.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                  <Input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder={t("messages.placeholder")}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMsg.trim()}>{t("messages.send")}</Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">{t("messages.selectConversation")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
