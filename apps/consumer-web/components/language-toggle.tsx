"use client";

import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="text-xs"
    >
      {lang === "en" ? "العربية" : "English"}
    </Button>
  );
}
