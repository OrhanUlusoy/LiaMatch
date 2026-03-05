"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { useViewMode } from "@/components/ViewModeProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Period = { start: string; end: string };

type StudentDetail = {
  user_id: string;
  first_name: string;
  last_name: string;
  track: string;
  school: string;
  city: string;
  skills: string[];
  github_url: string | null;
  linkedin_url: string | null;
  project_title: string | null;
  project_desc: string | null;
  project_url: string | null;
  availability_periods: Period[];
  cv_file_url: string | null;
  pb_file_url: string | null;
  updated_at: string;
};

export default function StudentDetailPage() {
  const t = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        router.push("/list");
        return;
      }

      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStudent(data);
      setLoading(false);
    })();
  }, [supabase, router, id, viewMode]);

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (notFound || !student) {
    return (
      <div className="pt-20 text-center space-y-3">
        <p className="text-sm text-muted-foreground">{t("studentDetail.notFound")}</p>
        <Link href="/list">
          <Button variant="secondary">{t("studentDetail.backToList")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/list" className="text-sm text-muted-foreground hover:text-foreground">
          ← {t("studentDetail.backToList")}
        </Link>
      </div>

      {/* Header card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {student.first_name} {student.last_name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {student.school} · {student.city}
                  </CardDescription>
                </div>
                <Badge className="text-sm">{student.track}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("studentDetail.skills")}</p>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((s) => (
                  <Badge key={s} className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {/* Social links */}
          <div className="flex flex-wrap gap-3">
            {student.github_url && (
              <a
                href={student.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}
            {student.linkedin_url && (
              <a
                href={student.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm hover:bg-secondary transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project */}
      {student.project_title && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("studentDetail.project")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{student.project_title}</p>
            {student.project_desc && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{student.project_desc}</p>
            )}
            {student.project_url && (
              <a
                href={student.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-primary underline hover:text-foreground"
              >
                {t("studentDetail.viewProject")} →
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Availability */}
      {student.availability_periods && student.availability_periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("studentDetail.availability")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {student.availability_periods.map((p, i) => (
                <Badge key={i} className="text-sm font-normal">
                  {p.start} — {p.end}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {(student.cv_file_url || student.pb_file_url) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("studentDetail.documents")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {student.cv_file_url && (
                <a
                  href={student.cv_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  {t("studentDetail.downloadCV")}
                </a>
              )}
              {student.pb_file_url && (
                <a
                  href={student.pb_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  {t("studentDetail.downloadPB")}
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        {t("studentDetail.lastUpdated")}: {new Date(student.updated_at).toLocaleDateString()}
      </p>
    </div>
  );
}
