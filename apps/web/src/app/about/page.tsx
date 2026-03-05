"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useI18n } from "@/i18n/I18nProvider";

const content = {
  sv: {
    title: "Om LiaMatch",
    intro:
      "LiaMatch är en dedikerad plattform för att matcha LIA-sökande studenter med arbetsgivare — utan distraktioner. Inget socialt flöde, inget brus. Bara tydliga profiler, enkla annonser och smart matchning.",
    howTitle: "Hur det fungerar",
    steps: [
      "Skapa en profil som student eller företag.",
      "Fyll i din inriktning, stad och tillgänglighetsperioder.",
      "Se matchscore 0–100 mot relevanta annonser/kandidater.",
      "Ansök eller visa intresse med ett klick.",
    ],
    scoring: "Matchning",
    scoringDesc:
      "Score baseras på: inriktnings-match (0–35p), skill-overlap (0–35p), stad (0–20p) och period-kompatibilitet (0–10p). All matchlogik är transparent — du ser alltid varför du matchar.",
    techTitle: "Teknik",
    techDesc:
      "Next.js (App Router), TypeScript, TailwindCSS, Supabase (Auth + Postgres + Storage). Hostable på Vercel + Supabase.",
  },
  en: {
    title: "About LiaMatch",
    intro:
      "LiaMatch is a dedicated platform for matching internship-seeking students with employers — no distractions. No social feed, no noise. Just clear profiles, simple listings, and smart matching.",
    howTitle: "How it works",
    steps: [
      "Create a profile as a student or company.",
      "Fill in your track, city, and availability periods.",
      "See a match score 0–100 against relevant listings/candidates.",
      "Apply or express interest with one click.",
    ],
    scoring: "Matching",
    scoringDesc:
      "Score is based on: track match (0–35pts), skill overlap (0–35pts), city (0–20pts), and period compatibility (0–10pts). All matching logic is transparent — you always see why you match.",
    techTitle: "Tech",
    techDesc:
      "Next.js (App Router), TypeScript, TailwindCSS, Supabase (Auth + Postgres + Storage). Deployable on Vercel + Supabase.",
  },
};

export default function AboutPage() {
  const { lang } = useI18n();
  const c = content[lang];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{c.title}</h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{c.intro}</p>

      <Card>
        <CardHeader>
          <CardTitle>{c.howTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            {c.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.scoring}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.scoringDesc}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{c.techTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{c.techDesc}</p>
        </CardContent>
      </Card>
    </div>
  );
}
