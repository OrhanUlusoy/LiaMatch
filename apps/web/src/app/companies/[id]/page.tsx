"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useT } from "@/i18n/useT";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type CompanyDetail = {
  user_id: string;
  company_name: string;
  city: string;
  website: string | null;
  description: string | null;
  vision: string | null;
  looking_for: string | null;
  updated_at: string;
  internships: {
    id: string;
    title: string;
    city: string;
    track_focus: string;
    seats: number;
    period_start: string | null;
    period_end: string | null;
  }[];
};

export default function CompanyDetailPage() {
  const t = useT();
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/companies/${params.id}`);
      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      setCompany(await res.json());
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) {
    return <p className="pt-20 text-center text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (error || !company) {
    return (
      <div className="space-y-4 pt-12 text-center">
        <p className="text-sm text-muted-foreground">{t("companyDetail.notFound")}</p>
        <Button variant="secondary" onClick={() => router.back()}>
          {t("companyDetail.backToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("companyDetail.backToList")}
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{company.company_name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>{company.city}</span>
            {company.website && (
              <>
                <span>·</span>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  {t("companyDetail.visitWebsite")}
                </a>
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {company.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("companyDetail.about")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {company.vision && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("companyDetail.vision")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{company.vision}</p>
          </CardContent>
        </Card>
      )}

      {company.looking_for && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("companyDetail.lookingFor")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{company.looking_for}</p>
          </CardContent>
        </Card>
      )}

      {/* Internship listings */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("companyDetail.openListings")}</h2>
        {company.internships.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("companyDetail.noListings")}</p>
        ) : (
          company.internships.map((intern) => (
            <Card key={intern.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{intern.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {intern.city} · <Badge>{intern.track_focus}</Badge>
                  </p>
                  {intern.period_start && intern.period_end && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(intern.period_start).toLocaleDateString()} – {new Date(intern.period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {intern.seats} {t("companyDetail.seats")}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
