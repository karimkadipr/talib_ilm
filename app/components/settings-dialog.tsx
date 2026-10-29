import { Download, FileWarning, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { type Backup, downloadBackup, readBackup, restoreBackup, summarize } from "~/lib/backup";
import { useLocalize } from "~/lib/localize";
import { usePreferences } from "~/lib/preferences";

/** Settings, opened from `trigger` (the gear in the top bar). */
export function SettingsDialog({ trigger }: { trigger: React.ReactNode }) {
  const { t } = useLocalize();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent closeLabel={t("settings.close")}>
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("shell.storageNotice")}</DialogDescription>
        </DialogHeader>
        {/* Remounted on each opening, so a file picked earlier doesn't linger. */}
        {open && <BackupSection />}
      </DialogContent>
    </Dialog>
  );
}

/** Download a backup file, or restore one after checking what it holds. */
function BackupSection() {
  const { t, lang } = useLocalize();
  const preferences = usePreferences();
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Backup | "invalid" | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Let the same file be picked again after a cancel.
    e.target.value = "";
    if (file) setPicked((await readBackup(file)) ?? "invalid");
  }

  const backup = picked !== "invalid" ? picked : null;
  const summary = backup && summarize(backup);
  const date =
    backup && new Intl.DateTimeFormat(lang, { dateStyle: "long", timeStyle: "short" }).format(new Date(backup.exportedAt));

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div>
        <h3 className="font-medium">{t("settings.backupTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("settings.backupHint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => downloadBackup(preferences, lang)}>
          <Download />
          {t("settings.download")}
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()} disabled={restoring}>
          <Upload />
          {t("settings.restore")}
        </Button>
        <input ref={input} type="file" accept=".json,application/json" className="hidden" onChange={onFile} />
      </div>

      {picked === "invalid" && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <FileWarning className="mt-0.5 size-4 shrink-0" />
          {t("settings.invalid")}
        </p>
      )}

      {backup && summary && (
        <div role="alert" className="space-y-3 rounded-lg border border-gold/40 bg-gold/5 p-3 text-sm">
          <p className="font-medium">{t("settings.fromDate", { date })}</p>
          <ul className="list-inside list-disc text-muted-foreground">
            <li>{t("settings.lessons", { count: summary.lessons })}</li>
            <li>{t("settings.books", { count: summary.books })}</li>
            <li>{t("settings.favorites", { count: summary.favorites })}</li>
            <li>{t("settings.notes", { count: summary.notes })}</li>
          </ul>
          <p className="text-muted-foreground">{t("settings.replaceWarning")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={restoring}
              onClick={() => {
                setRestoring(true);
                void restoreBackup(backup);
              }}
            >
              {restoring ? t("settings.restoring") : t("settings.confirmRestore")}
            </Button>
            <Button size="sm" variant="ghost" disabled={restoring} onClick={() => setPicked(null)}>
              {t("reader.cancel")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
