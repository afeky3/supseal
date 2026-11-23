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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/i18n";
import { createSupportTicket } from "@/lib/verify";
import { toast } from "sonner";

export function SupportDialog({
  open,
  onOpenChange,
  eventId,
  brandName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  brandName: string;
}) {
  const { t } = useLanguage();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createSupportTicket(eventId, subject, message);
      toast.success(t("support.sent"));
      onOpenChange(false);
      setSubject("");
      setMessage("");
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
          <DialogTitle>{t("support.dialogTitle", { brand: brandName })}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">{t("support.subjectLabel")}</Label>
            <Input
              id="subject"
              required
              disabled={submitting}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">{t("support.messageLabel")}</Label>
            <Textarea
              id="message"
              rows={4}
              required
              disabled={submitting}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {t("support.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
