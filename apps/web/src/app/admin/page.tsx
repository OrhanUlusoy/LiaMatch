"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";

type StudentProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  track: string;
  school: string;
  city: string;
};

type CompanyProfile = {
  user_id: string;
  company_name: string;
  city: string;
};

type UserRow = {
  id: string;
  email: string;
  role: string | null;
  created_at: string;
  last_sign_in: string | null;
  student: StudentProfile | null;
  company: CompanyProfile | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: string | null }) {
  const colors: Record<string, string> = {
    student: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    company: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    admin: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  const cls = role ? colors[role] ?? "bg-secondary text-muted-foreground" : "bg-secondary text-muted-foreground";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {role ?? "—"}
    </span>
  );
}

function ProfileInfo({ user }: { user: UserRow }) {
  if (user.student) {
    return (
      <span className="text-xs text-muted-foreground">
        {user.student.first_name} {user.student.last_name} · {user.student.track} · {user.student.city}
      </span>
    );
  }
  if (user.company) {
    return (
      <span className="text-xs text-muted-foreground">
        {user.company.company_name} · {user.company.city}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground italic">Ingen profil</span>;
}

export default function AdminPage() {
  const t = useT();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.student?.first_name.toLowerCase().includes(q) ||
      u.student?.last_name.toLowerCase().includes(q) ||
      u.student?.city.toLowerCase().includes(q) ||
      u.company?.company_name.toLowerCase().includes(q) ||
      u.company?.city.toLowerCase().includes(q)
    );
  });

  const studentCount = users.filter((u) => u.role === "student").length;
  const companyCount = users.filter((u) => u.role === "company").length;
  const noRoleCount = users.filter((u) => !u.role).length;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg pt-20 text-center">
        <Card>
          <CardContent className="py-10">
            <p className="text-sm font-medium text-red-500 dark:text-red-400">{t("admin.accessDenied")}</p>
            <p className="mt-2 text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/analytics" className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            Analys →
          </Link>
          <Link href="/admin/feedback" className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            Feedback →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">{t("admin.total")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-violet-500">{studentCount}</p>
            <p className="text-xs text-muted-foreground">{t("admin.students")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-cyan-500">{companyCount}</p>
            <p className="text-xs text-muted-foreground">{t("admin.companies")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{noRoleCount}</p>
            <p className="text-xs text-muted-foreground">{t("admin.noRole")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t("admin.userList")} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">{t("admin.colEmail")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.colRole")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.colProfile")}</th>
                <th className="pb-2 pr-4 font-medium">{t("admin.colCreated")}</th>
                <th className="pb-2 font-medium">{t("admin.colLastLogin")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4">
                    <span className="font-medium">{user.email}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3 pr-4">
                    <ProfileInfo user={user} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.last_sign_in)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    {t("admin.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
