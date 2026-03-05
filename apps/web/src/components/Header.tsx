"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/useT";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useViewMode } from "@/components/ViewModeProvider";

function NavLink({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function NotificationBell() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setCount(c ?? 0);
    })();
  }, [supabase]);

  return (
    <Link href="/notifications" aria-label="Notifications" className="relative rounded-md p-2 text-muted-foreground hover:text-foreground">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { viewMode, setViewMode, isAdmin, displayName } = useViewMode();
  const [isAuthed, setIsAuthed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsAuthed(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Effective role for nav visibility
  const effectiveRole = viewMode;

  const active = pathname?.startsWith("/dashboard")
    ? "dashboard"
    : pathname?.startsWith("/explore")
      ? "explore"
      : pathname?.startsWith("/about")
        ? "about"
        : pathname?.startsWith("/match")
          ? "match"
          : pathname?.startsWith("/feedback")
            ? "feedback"
            : pathname?.startsWith("/my-listings")
              ? "my-listings"
              : pathname?.startsWith("/list")
                ? "list"
                : pathname?.startsWith("/applications")
                  ? "applications"
                  : pathname?.startsWith("/admin")
                    ? "admin"
                    : pathname?.startsWith("/messages")
                      ? "messages"
                      : undefined;

  const closeMobile = () => setMobileOpen(false);

  const navLinks = (
    <>
      {isAuthed && (
        <NavLink href="/dashboard" active={active === "dashboard"} onClick={closeMobile}>
          {t("nav.dashboard")}
        </NavLink>
      )}
      {isAuthed && effectiveRole === "student" && (
        <>
          <NavLink href="/match" active={active === "match"} onClick={closeMobile}>
            {t("nav.match")}
          </NavLink>
          <NavLink href="/explore" active={active === "explore"} onClick={closeMobile}>
            {t("nav.explore")}
          </NavLink>
          <NavLink href="/applications" active={active === "applications"} onClick={closeMobile}>
            {t("nav.applications")}
          </NavLink>
        </>
      )}
      {isAuthed && effectiveRole === "company" && (
        <>
          <NavLink href="/my-listings" active={active === "my-listings"} onClick={closeMobile}>
            {t("nav.myListings")}
          </NavLink>
          <NavLink href="/list" active={active === "list"} onClick={closeMobile}>
            {t("nav.candidates")}
          </NavLink>
          <NavLink href="/applications" active={active === "applications"} onClick={closeMobile}>
            {t("nav.applications")}
          </NavLink>
          <NavLink href="/match" active={active === "match"} onClick={closeMobile}>
            {t("nav.match")}
          </NavLink>
        </>
      )}
      {isAuthed && effectiveRole === "admin" && (
        <NavLink href="/admin" active={active === "admin"} onClick={closeMobile}>
          Admin
        </NavLink>
      )}
      {!isAuthed && (
        <>
          <NavLink href="/explore" active={active === "explore"} onClick={closeMobile}>
            {t("nav.explore")}
          </NavLink>
          <NavLink href="/about" active={active === "about"} onClick={closeMobile}>
            {t("nav.about")}
          </NavLink>
        </>
      )}
      {isAuthed && (
        <NavLink href="/messages" active={active === "messages"} onClick={closeMobile}>
          {t("nav.messages")}
        </NavLink>
      )}
      <NavLink href="/feedback" active={active === "feedback"} onClick={closeMobile}>
        {t("nav.feedback")}
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur dark:bg-card/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-dark.png" alt={t("app.name")} width={32} height={32} className="hidden h-8 w-8 dark:block" unoptimized />
            <Image src="/logo-light.png" alt={t("app.name")} width={32} height={32} className="block h-8 w-8 dark:hidden" unoptimized />
            <span className="gradient-text text-xl font-bold tracking-tight">{t("app.name")}</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {navLinks}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && <ViewModeSwitcher current={viewMode} onChange={setViewMode} />}
          {isAuthed && <NotificationBell />}
          {isAuthed && displayName && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {displayName}
            </span>
          )}
          <ThemeToggle />
          <LanguageToggle />
          {isAuthed ? (
            <>
              <Link href="/profile" className="hidden sm:inline-flex">
                <Button variant="secondary">{t("nav.profile")}</Button>
              </Link>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex">
              <Button>{t("nav.login")}</Button>
            </Link>
          )}
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {isAuthed ? (
              <>
                <Link href="/profile" onClick={closeMobile}>
                  <Button variant="secondary" className="w-full">{t("nav.profile")}</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setMobileOpen(false);
                    router.refresh();
                  }}
                >
                  {t("nav.signOut")}
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={closeMobile}>
                <Button className="w-full">{t("nav.login")}</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const VIEW_LABELS: Record<string, { label: string; icon: string }> = {
  admin: { label: "Admin", icon: "A" },
  company: { label: "Företag", icon: "F" },
  student: { label: "Student", icon: "S" },
};

function ViewModeSwitcher({
  current,
  onChange,
}: {
  current: string;
  onChange: (mode: "admin" | "company" | "student") => void;
}) {
  const [open, setOpen] = useState(false);
  const modes = ["admin", "company", "student"] as const;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
        aria-label={`View mode: ${VIEW_LABELS[current].label}`}
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {VIEW_LABELS[current].icon}
        </span>
        {VIEW_LABELS[current].label}
        <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-36 rounded-md border border-border bg-card shadow-lg">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { onChange(mode); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary",
                  current === mode && "bg-secondary font-medium",
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {VIEW_LABELS[mode].icon}
                </span>
                {VIEW_LABELS[mode].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
