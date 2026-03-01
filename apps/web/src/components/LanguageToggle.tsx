"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "@/i18n/lang";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

export function LanguageToggle() {
  const { lang } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLang: Lang = lang === "sv" ? "en" : "sv";

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          setCookie(LANG_COOKIE, nextLang);
          router.refresh();
        });
      }}
    >
      {lang === "sv" ? "EN" : "SV"}
    </Button>
  );
}
