"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n";
import { createFraudReport } from "@/lib/verify";
import { toast } from "sonner";

export function ReportDialog({
  open,
  onOpenChange,
  eventId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}) {
  const { t } = useLanguage();
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createFraudReport(eventId, location);
      toast.success(t("report.sent"));
      onOpenChange(false);
      setLocation("");
    } catch {
      toast.error(t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("report.dialogTitle")}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="location">{t("report.locationLabel")}</Label>
            <Textarea
              id="location"
              rows={3}
              required
              placeholder={t("report.locationPlaceholder")}
              disabled={submitting}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {t("report.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
