"use client";

import Link from "next/link";
import { useT } from "@/i18n/useT";

export function Footer() {
  const t = useT();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} LiaMatch</p>
        <nav className="flex gap-4">
          <Link href="/about" className="hover:text-foreground transition-colors">
            {t("footer.about")}
          </Link>
          <Link href="/feedback" className="hover:text-foreground transition-colors">
            {t("footer.feedback")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("footer.privacy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
