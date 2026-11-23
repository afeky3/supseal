"use client";

import type { CheckCodeResult, VerifyContext } from "@supseal/shared-types";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ResultView } from "@/components/result-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/device";
import { useLanguage } from "@/lib/i18n";
import { checkCode } from "@/lib/verify";

export function VerificationFlow({ initialContext }: { initialContext: VerifyContext | null }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [result, setResult] = useState<CheckCodeResult | null>(null);
  // A VERIFIED result carries its own product/brand; VERIFIED_BEFORE and
  // UNVERIFIED don't (there's nothing to show for a code that matched
  // nothing), so the context from the initial QR scan is what the result
  // view falls back to for brand name etc.
  const [context] = useState(initialContext);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setRateLimited(false);
    setSubmitting(true);
    try {
      const res = await checkCode(code, getDeviceFingerprint());
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRateLimited(true);
      } else {
        setError(t("error.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setCode("");
    setError(null);
    setRateLimited(false);
  }

  if (result) {
    return <ResultView result={result} context={context} onReset={reset} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/15">
            <ShieldCheck className="size-7 text-primary" />
          </div>

          {context ? (
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{context.product.name}</h1>
              <p className="text-sm text-muted-foreground">
                {t("landing.byProduct")} {context.brand.name}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h1 className="text-xl font-semibold">{t("landing.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("landing.manualIntro")}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{t("landing.subtitle")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="code">{t("landing.codeLabel")}</Label>
              <Input
                id="code"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                placeholder={t("landing.codePlaceholder")}
                className="text-center font-mono text-lg tracking-wider"
                disabled={submitting}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            {rateLimited && (
              <div className="rounded-lg bg-destructive/10 p-3 text-center">
                <div className="text-sm font-medium text-destructive">{t("rateLimited.title")}</div>
                <div className="text-xs text-muted-foreground">{t("rateLimited.subtitle")}</div>
              </div>
            )}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting || !code.trim()}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? t("landing.checking") : t("landing.verifyButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
