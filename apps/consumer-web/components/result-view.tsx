"use client";

import type { CheckCodeResult, VerifyContext } from "@supseal/shared-types";
import { AlertTriangle, CheckCircle2, Copy, MessageCircle, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import { ReportDialog } from "@/components/report-dialog";
import { SupportDialog } from "@/components/support-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";

export function ResultView({
  result,
  context,
  onReset,
}: {
  result: CheckCodeResult;
  context: VerifyContext | null;
  onReset: () => void;
}) {
  const { t, lang } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const brandName = result.outcome === "VERIFIED" ? result.brand.name : (context?.brand.name ?? "");
  const productName = result.outcome === "VERIFIED" ? result.product.name : context?.product.name;

  function copyCoupon(code: string) {
    navigator.clipboard.writeText(code).then(() => toast.success(code));
  }

  return (
    <div className="space-y-4">
      {result.outcome === "VERIFIED" && (
        <Card className="border-chart-2/30">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-chart-2/15">
              <CheckCircle2 className="size-7 text-chart-2" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{t("result.verified.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("result.verified.subtitle")}</p>
            </div>
            <div>
              <div className="text-base font-medium">{productName}</div>
              <div className="text-sm text-muted-foreground">
                {t("landing.byProduct")} {brandName}
              </div>
            </div>

            {result.couponCode && (
              <button
                onClick={() => copyCoupon(result.couponCode!)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-chart-2/40 bg-chart-2/10 px-4 py-3 text-left"
              >
                <div>
                  <div className="text-xs text-muted-foreground">{t("result.verified.coupon")}</div>
                  <div className="font-mono text-base font-semibold">{result.couponCode}</div>
                </div>
                <Copy className="size-4 text-muted-foreground" />
              </button>
            )}
            {result.couponCode && (
              <p className="text-xs text-muted-foreground">{t("result.verified.couponHint")}</p>
            )}
          </CardContent>
        </Card>
      )}

      {result.outcome === "VERIFIED_BEFORE" && (
        <Card className="border-chart-3/30">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-chart-3/15">
              <AlertTriangle className="size-7 text-chart-3" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{t("result.verifiedBefore.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("result.verifiedBefore.subtitle")}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {t("result.verifiedBefore.firstChecked")}{" "}
                {new Date(result.firstVerifiedAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
              </Badge>
              <Badge variant="secondary">
                {t("result.verifiedBefore.count")} {result.verificationCount}
              </Badge>
            </div>
            <p className="rounded-lg bg-chart-3/10 p-3 text-xs text-muted-foreground">
              {t("result.verifiedBefore.warning")}
            </p>
          </CardContent>
        </Card>
      )}

      {result.outcome === "UNVERIFIED" && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/15">
              <XCircle className="size-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{t("result.unverified.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("result.unverified.subtitle")}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("result.unverified.reportPrompt")}</p>
            <Button variant="destructive" className="w-full" onClick={() => setReportOpen(true)}>
              <ShieldAlert className="size-4" />
              {t("result.unverified.reportButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(result.outcome === "VERIFIED" || result.outcome === "VERIFIED_BEFORE") && brandName && (
          <Button variant="outline" className="flex-1" onClick={() => setSupportOpen(true)}>
            <MessageCircle className="size-4" />
            {t("actions.contactSupport")}
          </Button>
        )}
        <Button variant="secondary" className="flex-1" onClick={onReset}>
          {t("actions.checkAnother")}
        </Button>
      </div>

      {(result.outcome === "VERIFIED" || result.outcome === "VERIFIED_BEFORE") && (
        <SupportDialog
          open={supportOpen}
          onOpenChange={setSupportOpen}
          eventId={result.eventId}
          brandName={brandName}
        />
      )}
      {result.outcome === "UNVERIFIED" && (
        <ReportDialog open={reportOpen} onOpenChange={setReportOpen} eventId={result.eventId} />
      )}
    </div>
  );
}
