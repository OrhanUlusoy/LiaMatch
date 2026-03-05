"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useViewMode } from "@/components/ViewModeProvider";

type Student = {
  user_id: string;
  first_name: string;
  last_name: string;
  track: string;
  school: string;
  city: string;
  github_url: string | null;
  linkedin_url: string | null;
};

export default function ListPage() {
  const t = useT();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode } = useViewMode();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Allow actual company users or admin in company viewMode
      if (viewMode !== "company") {
        router.push("/");
        return;
      }
      setAuthorized(true);

      const res = await fetch("/api/students/open");
      const list = await res.json();
      if (Array.isArray(list)) setStudents(list);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (!authorized) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("list.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("list.subtitle")}</p>
      </div>

      {loading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      {!loading && students.length === 0 && (
        <div className="rounded-md bg-secondary border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {students.map((s) => (
          <Link key={s.user_id} href={`/students/${s.user_id}`}>
            <Card className="transition-colors hover:border-primary/40 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">
                  {s.first_name} {s.last_name}
                </CardTitle>
                <CardDescription>
                  {s.school} · {s.city}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge>{s.track}</Badge>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {s.github_url && <span>GitHub</span>}
                  {s.linkedin_url && <span>LinkedIn</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
