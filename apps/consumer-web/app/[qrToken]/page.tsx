"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationFlow } from "@/components/verification-flow";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { getContext } from "@/lib/verify";

export default function QrLandingPage() {
  const params = useParams<{ qrToken: string }>();
  const { t } = useLanguage();

  const { data: context, isLoading, error } = useQuery({
    queryKey: ["verify-context", params.qrToken],
    queryFn: () => getContext(params.qrToken),
    retry: false,
  });

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <PageShell>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {notFound && (
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {t("landing.productUnknown")}
            </p>
          )}
          <VerificationFlow initialContext={context ?? null} />
        </>
      )}
    </PageShell>
  );
}
