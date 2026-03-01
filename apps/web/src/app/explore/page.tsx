"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { useI18n } from "@/i18n/I18nProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";

type Role = "student" | "company" | null;
type Internship = {
  id: string;
  title: string;
  description: string;
  city: string;
  track_focus: string;
  skills: string[];
  seats: number;
  period_start: string | null;
  period_end: string | null;
  application_start: string | null;
  application_end: string | null;
  company_profiles: { company_name: string } | null;
};

export default function ExplorePage() {
  const t = useT();
  const { lang } = useI18n();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [role, setRole] = useState<Role>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (city?: string, track?: string) => {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (track) params.set("track", track);
      const res = await fetch(`/api/internships?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setInternships(data);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role ?? null);
      }
      await load();
    })();
  }, [supabase, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(cityFilter, trackFilter);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("explore.title")}</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4 pt-4">
            <div className="space-y-1">
              <Label>{t("explore.city")}</Label>
              <Input
                placeholder={t("explore.city")}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("explore.track")}</Label>
              <Input
                placeholder={t("explore.track")}
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
              />
            </div>
            <Button type="submit">{t("explore.search")}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Create internship (company only) */}
      {role === "company" && <CreateInternshipForm onCreated={() => load(cityFilter, trackFilter)} />}

      {/* Results */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-600">
          {t("explore.results")} ({internships.length})
        </h2>
        {loading && <p className="text-sm text-neutral-500">{t("common.loading")}</p>}
        {internships.map((i) => (
          <Card key={i.id} className="mb-4">
            <CardHeader>
              <CardTitle>{i.title}</CardTitle>
              <CardDescription>
                {i.company_profiles?.company_name ?? "—"} · {i.city} ·{" "}
                {i.seats} {lang === "sv" ? "platser" : "seats"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap mb-3">{i.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{i.track_focus}</Badge>
                {i.skills?.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              {i.period_start && i.period_end && (
                <p className="mt-2 text-xs text-neutral-500">
                  {lang === "sv" ? "Period" : "Period"}: {i.period_start} — {i.period_end}
                </p>
              )}
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
      setForm({
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? t("common.loading") : t("internship.create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
