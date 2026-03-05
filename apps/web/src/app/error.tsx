"use client";

import { useT } from "@/i18n/useT";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="gradient-text text-5xl font-bold">{t("common.error")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t("common.errorBody")}
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
