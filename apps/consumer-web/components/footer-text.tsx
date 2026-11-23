"use client";

import { useLanguage } from "@/lib/i18n";

export function FooterText() {
  const { t } = useLanguage();
  return <>{t("footer.poweredBy")}</>;
}
