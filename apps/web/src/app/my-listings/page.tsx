"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { useViewMode } from "@/components/ViewModeProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type Listing = {
  id: string;
  title: string;
  description: string;
  city: string;
  track_focus: string;
  skills: string[];
  seats: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  applicant_count?: number;
};

export default function MyListingsPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadListings = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: internships } = await supabase
      .from("internships")
      .select("*")
      .eq("company_user_id", user.id)
      .order("created_at", { ascending: false });

    if (!internships) {
      setListings([]);
      setLoading(false);
      return;
    }

    // Count applicants per listing
    const { data: apps } = await supabase
      .from("applications")
      .select("internship_id")
      .in(
        "internship_id",
        internships.map((i) => i.id),
      );

    const counts: Record<string, number> = {};
    (apps ?? []).forEach((a) => {
      counts[a.internship_id] = (counts[a.internship_id] ?? 0) + 1;
    });

    setListings(
      internships.map((i) => ({
        ...i,
        skills: Array.isArray(i.skills) ? i.skills : [],
        applicant_count: counts[i.id] ?? 0,
      })),
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (viewMode !== "company") {
        router.push("/dashboard");
        return;
      }
      await loadListings();
    })();
  }, [supabase, router, viewMode, loadListings]);

  async function handleDelete(id: string) {
    if (!confirm(t("myListings.confirmDelete"))) return;
    await supabase.from("internships").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("myListings.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("myListings.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t("common.cancel") : t("myListings.create")}
        </Button>
      </div>

      {showForm && (
        <CreateInternshipForm
          onCreated={() => {
            setShowForm(false);
            loadListings();
          }}
        />
      )}

      {listings.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="mb-3 h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <p className="text-sm font-medium text-muted-foreground">{t("myListings.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{t("myListings.emptyHint")}</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              {t("myListings.create")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{listing.title}</CardTitle>
                  <CardDescription>
                    {listing.city} · {listing.seats} {t("myListings.seats")}
                    {listing.period_start && listing.period_end && (
                      <> · {listing.period_start} — {listing.period_end}</>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/match`}>
                    <Badge className="cursor-pointer">
                      {listing.applicant_count} {t("myListings.applicants")}
                    </Badge>
                  </Link>
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(listing.id)}
                  >
                    {t("myListings.delete")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{listing.track_focus}</Badge>
                {listing.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateInternshipForm({ onCreated }: { onCreated: () => void }) {
  const t = useT();
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    track_focus: "",
    skills: "",
    seats: "1",
    period_start: "",
    period_end: "",
    application_start: "",
    application_end: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description,
      city: form.city,
      track_focus: form.track_focus,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      seats: parseInt(form.seats, 10) || 1,
      period_start: form.period_start || undefined,
      period_end: form.period_end || undefined,
      application_start: form.application_start || undefined,
      application_end: form.application_end || undefined,
    };

    const res = await fetch("/api/internships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (res.ok) {
      onCreated();
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : JSON.stringify(data.error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("internship.newTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t("internship.title")} *</Label>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("internship.description")} *</Label>
            <Textarea required value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("profile.city")} *</Label>
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("internship.trackFocus")} *</Label>
              <Input required value={form.track_focus} onChange={(e) => set("track_focus", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("internship.skills")}</Label>
            <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Python, Docker, ML…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t("internship.seats")}</Label>
              <Input type="number" min="1" value={form.seats} onChange={(e) => set("seats", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("internship.periodStart")}</Label>
              <Input type="date" value={form.period_start} onChange={(e) => set("period_start", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("internship.periodEnd")}</Label>
              <Input type="date" value={form.period_end} onChange={(e) => set("period_end", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("internship.applicationStart")}</Label>
              <Input type="date" value={form.application_start} onChange={(e) => set("application_start", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("internship.applicationEnd")}</Label>
              <Input type="date" value={form.application_end} onChange={(e) => set("application_end", e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? t("common.loading") : t("internship.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
