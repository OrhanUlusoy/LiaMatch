"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/i18n/useT";

export function GdprSection() {
  const t = useT();
  const router = useRouter();

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  // Delete state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  async function handleExport() {
    setExporting(true);
    setExportMsg("");
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "liamatch-data.json";
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg(t("gdpr.exportDone"));
    } catch {
      setExportMsg(t("gdpr.exportError"));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteMsg("");
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDeleteMsg(t("gdpr.deleteDone"));
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setDeleteMsg(t("gdpr.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Data export */}
      <Card>
        <CardHeader>
          <CardTitle>{t("gdpr.exportTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("gdpr.exportDesc")}</p>
          <Button onClick={handleExport} disabled={exporting} variant="secondary">
            {exporting ? t("gdpr.exporting") : t("gdpr.exportBtn")}
          </Button>
          {exportMsg && <p className="text-sm text-muted-foreground">{exportMsg}</p>}
        </CardContent>
      </Card>

      {/* Account deletion */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            {t("gdpr.deleteTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("gdpr.deleteDesc")}</p>
          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              variant="secondary"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {t("gdpr.deleteBtn")}
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {t("gdpr.deleteConfirmTitle")}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {t("gdpr.deleteConfirmBody")}
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t("gdpr.deleteConfirmPlaceholder")}
                className="max-w-xs"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleting ? t("gdpr.deleting") : t("gdpr.deleteConfirmBtn")}
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                  }}
                  variant="secondary"
                >
                  {t("common.cancel")}
                </Button>
              </div>
              {deleteMsg && <p className="text-sm text-red-600">{deleteMsg}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
