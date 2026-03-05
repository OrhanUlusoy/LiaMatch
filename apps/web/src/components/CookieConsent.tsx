"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

const CONSENT_KEY = "liaMatch_cookieConsent";

export function CookieConsent() {
  const t = useT();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(CONSENT_KEY);
    if (!accepted) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-4 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("cookieConsent.message")}{" "}
          <Link href="/privacy" className="text-primary underline hover:no-underline">
            {t("cookieConsent.learnMore")}
          </Link>
        </p>
        <Button onClick={accept} className="shrink-0">
          {t("cookieConsent.accept")}
        </Button>
      </div>
    </div>
  );
}
