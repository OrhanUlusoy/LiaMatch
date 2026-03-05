"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

/* ── Feature card ── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ── Step card ── */
function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-lg font-bold text-primary">
        {number}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

export default function Home() {
  const t = useT();

  return (
    <div className="space-y-20 pb-16">
      {/* ── Hero ── */}
      <section className="relative pt-12 text-center md:pt-20">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="mx-auto mb-6 flex items-center justify-center">
          <Image src="/logo-text-dark.png" alt="LiaMatch" width={400} height={120} className="hidden h-auto w-80 dark:block md:w-96" unoptimized />
          <Image src="/logo-text-light.png" alt="LiaMatch" width={400} height={120} className="block h-auto w-80 dark:hidden md:w-96" unoptimized />
        </div>
        <h1 className="sr-only">{t("home.heroTitle")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button className="px-8 py-3 text-base">{t("home.primaryCta")}</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary" className="px-8 py-3 text-base">{t("home.secondaryCta")}</Button>
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section>
        <h2 className="mb-8 text-center text-3xl font-bold">{t("home.featuresTitle")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
            title={t("home.featureProfile")}
            desc={t("home.featureProfileDesc")}
          />
          <FeatureCard
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
            title={t("home.featureMatch")}
            desc={t("home.featureMatchDesc")}
          />
          <FeatureCard
            icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>}
            title={t("home.featureChat")}
            desc={t("home.featureChatDesc")}
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section>
        <h2 className="mb-10 text-center text-3xl font-bold">{t("home.howTitle")}</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Step number={1} title={t("home.step1")} desc={t("home.step1Desc")} />
          <Step number={2} title={t("home.step2")} desc={t("home.step2Desc")} />
          <Step number={3} title={t("home.step3")} desc={t("home.step3Desc")} />
          <Step number={4} title={t("home.step4")} desc={t("home.step4Desc")} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center md:p-12">
        <h2 className="text-3xl font-bold">{t("home.ctaTitle")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("home.ctaSubtitle")}</p>
        <div className="mt-6">
          <Link href="/login">
            <Button className="px-8 py-3 text-base">{t("home.primaryCta")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
