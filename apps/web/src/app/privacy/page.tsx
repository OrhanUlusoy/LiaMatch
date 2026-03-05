"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";

export default function PrivacyPage() {
  const t = useT();

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">{t("privacy.title")}</h1>
      <p className="text-xs text-muted-foreground">
        {t("privacy.lastUpdated")}: 2026-03-06
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.introTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("privacy.intro")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.whatWeCollectTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t("privacy.whatWeCollect1")}</li>
            <li>{t("privacy.whatWeCollect2")}</li>
            <li>{t("privacy.whatWeCollect3")}</li>
            <li>{t("privacy.whatWeCollect4")}</li>
            <li>{t("privacy.whatWeCollect5")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.whyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t("privacy.why1")}</li>
            <li>{t("privacy.why2")}</li>
            <li>{t("privacy.why3")}</li>
            <li>{t("privacy.why4")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.storageTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("privacy.storage")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.rightsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t("privacy.rights1")}</li>
            <li>{t("privacy.rights2")}</li>
            <li>{t("privacy.rights3")}</li>
            <li>{t("privacy.rights4")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.cookiesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("privacy.cookies")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.contactTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("privacy.contact")}{" "}
            <a
              href="mailto:support@liamatch.se"
              className="text-primary underline hover:no-underline"
            >
              support@liamatch.se
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
