"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/useT";
import { useI18n } from "@/i18n/I18nProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CardSkeleton } from "@/components/ui/Skeleton";

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

  const [internships, setInternships] = useState<Internship[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isAuthed, setIsAuthed] = useState(false);

  // Load saved listings for bookmark toggle
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsAuthed(true);
      const { data } = await supabase
        .from("saved_listings")
        .select("internship_id")
        .eq("student_user_id", user.id);
      if (data) setSavedIds(new Set(data.map(r => r.internship_id)));
    })();
  }, [supabase]);

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
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(cityFilter, trackFilter);
  }

  function clearFilters() {
    setCityFilter("");
    setTrackFilter("");
    setKeyword("");
    load();
  }

  async function toggleSave(internshipId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (savedIds.has(internshipId)) {
      await supabase.from("saved_listings").delete().eq("student_user_id", user.id).eq("internship_id", internshipId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(internshipId); return n; });
    } else {
      await supabase.from("saved_listings").insert({ student_user_id: user.id, internship_id: internshipId });
      setSavedIds(prev => new Set(prev).add(internshipId));
    }
  }

  // Client-side keyword filter
  const filtered = keyword
    ? internships.filter(i => {
        const q = keyword.toLowerCase();
        return i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.company_profiles?.company_name?.toLowerCase().includes(q) ||
          i.skills?.some(s => s.toLowerCase().includes(q));
      })
    : internships;

  const hasFilters = cityFilter || trackFilter || keyword;

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
            <div className="space-y-1">
              <Label>{t("explore.keyword")}</Label>
              <Input
                placeholder={t("explore.keywordPlaceholder")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Button type="submit">{t("explore.search")}</Button>
            {hasFilters && (
              <Button type="button" variant="ghost" onClick={clearFilters}>{t("explore.clear")}</Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("explore.results")} ({filtered.length})
        </h2>
        {loading && <div className="grid gap-4 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t("explore.noResults")}</p>
        )}
        {filtered.map((i) => (
          <Card key={i.id} className="mb-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{i.title}</CardTitle>
                  <CardDescription>
                    {i.company_profiles?.company_name ?? "—"} · {i.city} ·{" "}
                    {i.seats} {lang === "sv" ? "platser" : "seats"}
                  </CardDescription>
                </div>
                {isAuthed && (
                  <button type="button" onClick={() => toggleSave(i.id)} className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors" title={savedIds.has(i.id) ? t("explore.unsave") : t("explore.save")}>
                    <svg className="h-5 w-5" fill={savedIds.has(i.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{i.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{i.track_focus}</Badge>
                {i.skills?.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              {i.period_start && i.period_end && (
                <p className="mt-2 text-xs text-muted-foreground">
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
