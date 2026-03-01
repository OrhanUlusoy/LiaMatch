"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";

export default function Home() {
  const t = useT();

  return (
    <div className="space-y-8">
      <section className="pt-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-600">
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/login">
            <Button>{t("home.primaryCta")}</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary">{t("home.secondaryCta")}</Button>
          </Link>
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>{t("app.name")}</CardTitle>
            <CardDescription>{t("app.tagline")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-medium">1) Profil</div>
                <div className="mt-1 text-sm text-neutral-600">Fyll i track, stad och period.</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-medium">2) Match</div>
                <div className="mt-1 text-sm text-neutral-600">Få matchscore 0–100 med transparens.</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-medium">3) Intresse</div>
                <div className="mt-1 text-sm text-neutral-600">Ansök / visa intresse med enkel status.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
