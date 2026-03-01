"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Reason = { key: string; label: string; points: number };

type StudentMatch = {
  internship: {
    id: string;
    title: string;
    city: string;
    track_focus: string;
    skills: string[];
    period_start: string | null;
    period_end: string | null;
    company_profiles: { company_name: string } | null;
  };
  score: number;
  reasons: Reason[];
};

function reasonLabel(r: Reason): string {
  const labels: Record<string, string> = {
    track_exact: "Inriktning matchar exakt",
    track_related: "Relaterad inriktning",
    track_none: "Inriktning matchar ej",
    city_exact: "Stad matchar exakt",
    city_remote: "Remote möjligt",
    city_region: "Samma region",
    city_none: "Stad matchar ej",
    period_full: "Period matchar helt",
    period_partial: "Period matchar delvis",
    period_none: "Period matchar ej",
    period_unknown: "Period okänd",
  };
  if (r.key === "skills") return `Skills: ${r.label}`;
  return labels[r.label] ?? r.label;
}

export default function MatchPage() {
  const t = useT();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [role, setRole] = useState<string | null>(null);
  const [matches, setMatches] = useState<StudentMatch[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role ?? null);

      if (profile?.role === "student") {
        const res = await fetch("/api/matches/student");
        const data = await res.json();
        if (Array.isArray(data)) setMatches(data);

        // Load existing applications
        const appRes = await fetch("/api/applications");
        const appData = await appRes.json();
        if (Array.isArray(appData)) {
          setApplied(new Set(appData.map((a: { internship_id: string }) => a.internship_id)));
        }
      }

      setLoading(false);
    })();
  }, [supabase]);

  const handleApply = useCallback(
    async (internshipId: string) => {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      });
      if (res.ok) {
        setApplied((prev) => new Set(prev).add(internshipId));
      }
    },
    [],
  );

  if (loading) {
    return <p className="pt-20 text-center text-sm text-neutral-500">{t("common.loading")}</p>;
  }

  if (role === "student") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("match.title")}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t("match.studentSubtitle")}</p>
        </div>
        {matches.length === 0 && (
          <p className="text-sm text-neutral-500">Inga matchningar hittades. Fyll i din profil först.</p>
        )}
        {matches.map((m) => (
          <Card key={m.internship.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{m.internship.title}</CardTitle>
                  <CardDescription>
                    {m.internship.company_profiles?.company_name ?? "—"} · {m.internship.city}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-semibold text-white">
                    {m.score}
                  </span>
                  <span className="text-xs text-neutral-500">{t("match.score")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <Badge>{m.internship.track_focus}</Badge>
                {m.internship.skills?.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>

              <details className="mb-3">
                <summary className="cursor-pointer text-xs font-medium text-neutral-600 hover:text-neutral-900">
                  {t("match.whyTitle")}
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                  {m.reasons.map((r, i) => (
                    <li key={i}>
                      <span className="font-medium">{r.points}p</span> — {reasonLabel(r)}
                    </li>
                  ))}
                </ul>
              </details>

              {applied.has(m.internship.id) ? (
                <Button variant="secondary" disabled>
                  {t("match.applied")}
                </Button>
              ) : (
                <Button onClick={() => handleApply(m.internship.id)}>
                  {t("match.apply")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Company view: placeholder (shows instructions to go to explore/create)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("match.title")}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t("match.companySubtitle")}</p>
      </div>
      <CompanyMatchView />
    </div>
  );
}

function CompanyMatchView() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [internships, setInternships] = useState<{ id: string; title: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<
    Array<{
      student: { first_name: string; last_name: string; track: string; city: string };
      score: number;
      reasons: Reason[];
    }>
  >([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("internships")
        .select("id, title")
        .eq("company_user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setInternships(data);
    })();
  }, [supabase]);

  async function loadCandidates(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/matches/company?internship_id=${id}`);
    const data = await res.json();
    if (Array.isArray(data)) setCandidates(data);
  }

  return (
    <div className="space-y-4">
      {internships.length === 0 && (
        <p className="text-sm text-neutral-500">Du har inga annonser ännu. Skapa en annons under Utforska.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {internships.map((i) => (
          <Button
            key={i.id}
            variant={selectedId === i.id ? "primary" : "secondary"}
            onClick={() => loadCandidates(i.id)}
          >
            {i.title}
          </Button>
        ))}
      </div>
      {candidates.map((c, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {c.student.first_name} {c.student.last_name}
                </CardTitle>
                <CardDescription>
                  {c.student.track} · {c.student.city}
                </CardDescription>
              </div>
              <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-semibold text-white">
                {c.score}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-neutral-600">
              {c.reasons.map((r, i) => (
                <li key={i}>
                  <span className="font-medium">{r.points}p</span> — {reasonLabel(r)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
