"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ar";

const STORAGE_KEY = "supseal_lang";

const dictionaries = {
  en: {
    "app.tagline": "Product authentication",
    "landing.title": "Verify your product",
    "landing.subtitle": "Scratch the panel on your sticker and enter the hidden code below.",
    "landing.manualIntro": "Have a code but no QR to scan? Enter it here.",
    "landing.codeLabel": "Hidden code",
    "landing.codePlaceholder": "e.g. ABCD-EFGH-2345",
    "landing.verifyButton": "Verify",
    "landing.checking": "Checking…",
    "landing.productUnknown": "This QR code isn't recognized. You can still enter a code manually below.",
    "landing.byProduct": "by",
    "result.verified.title": "Genuine product",
    "result.verified.subtitle": "This is the first time this code has been checked.",
    "result.verified.coupon": "Your one-time discount code",
    "result.verified.couponHint": "Show this at checkout or enter it online.",
    "result.verifiedBefore.title": "Already checked",
    "result.verifiedBefore.subtitle": "This code has been verified before.",
    "result.verifiedBefore.firstChecked": "First checked on",
    "result.verifiedBefore.count": "Total checks",
    "result.verifiedBefore.warning":
      "If you didn't check this product before, it may have already been opened or resold. Contact the brand if you're unsure.",
    "result.unverified.title": "Not verified",
    "result.unverified.subtitle": "We couldn't confirm this code. This product may be counterfeit.",
    "result.unverified.reportPrompt": "Help us investigate — tell us where you bought this.",
    "result.unverified.reportButton": "Report where you bought this",
    "actions.contactSupport": "Contact support",
    "actions.checkAnother": "Check another product",
    "actions.tryAgain": "Try again",
    "support.dialogTitle": "Contact {brand} support",
    "support.subjectLabel": "Subject",
    "support.messageLabel": "Message",
    "support.submit": "Send",
    "support.sent": "Message sent — the brand will follow up with you.",
    "report.dialogTitle": "Report where you bought this",
    "report.locationLabel": "Store or seller name, and location",
    "report.locationPlaceholder": "e.g. XYZ Pharmacy, Nasr City, Cairo",
    "report.submit": "Submit report",
    "report.sent": "Thanks — this has been reported to our fraud team.",
    "rateLimited.title": "Too many attempts",
    "rateLimited.subtitle": "Please wait a few minutes before trying again.",
    "error.generic": "Something went wrong. Please try again.",
    "footer.poweredBy": "Secured by SUPSEAL",
  },
  ar: {
    "app.tagline": "منصة توثيق المنتجات",
    "landing.title": "تحقق من منتجك",
    "landing.subtitle": "اخدش اللوحة الموجودة على الملصق وأدخل الكود المخفي بالأسفل.",
    "landing.manualIntro": "عندك كود بدون QR؟ أدخله هنا.",
    "landing.codeLabel": "الكود المخفي",
    "landing.codePlaceholder": "مثال: ABCD-EFGH-2345",
    "landing.verifyButton": "تحقق",
    "landing.checking": "جاري التحقق…",
    "landing.productUnknown": "لم يتم التعرف على رمز QR هذا. يمكنك إدخال الكود يدويًا بالأسفل.",
    "landing.byProduct": "من",
    "result.verified.title": "منتج أصلي",
    "result.verified.subtitle": "هذه أول مرة يتم فيها التحقق من هذا الكود.",
    "result.verified.coupon": "كود الخصم الخاص بك",
    "result.verified.couponHint": "اعرض هذا الكود عند الدفع أو أدخله أونلاين.",
    "result.verifiedBefore.title": "تم التحقق منه من قبل",
    "result.verifiedBefore.subtitle": "تم التحقق من هذا الكود من قبل.",
    "result.verifiedBefore.firstChecked": "أول تحقق بتاريخ",
    "result.verifiedBefore.count": "إجمالي مرات التحقق",
    "result.verifiedBefore.warning":
      "إذا لم تكن أنت من تحقق من هذا المنتج من قبل، فقد يكون تم فتحه أو بيعه سابقًا. تواصل مع البراند إذا كنت غير متأكد.",
    "result.unverified.title": "غير موثّق",
    "result.unverified.subtitle": "لم نتمكن من تأكيد هذا الكود. قد يكون هذا المنتج مقلدًا.",
    "result.unverified.reportPrompt": "ساعدنا في التحقيق — أخبرنا من أين اشتريت هذا المنتج.",
    "result.unverified.reportButton": "بلّغ عن مكان الشراء",
    "actions.contactSupport": "تواصل مع الدعم",
    "actions.checkAnother": "تحقق من منتج آخر",
    "actions.tryAgain": "حاول مرة أخرى",
    "support.dialogTitle": "تواصل مع دعم {brand}",
    "support.subjectLabel": "الموضوع",
    "support.messageLabel": "الرسالة",
    "support.submit": "إرسال",
    "support.sent": "تم إرسال رسالتك — سيتواصل معك البراند.",
    "report.dialogTitle": "بلّغ عن مكان الشراء",
    "report.locationLabel": "اسم المتجر أو البائع والموقع",
    "report.locationPlaceholder": "مثال: صيدلية س، مدينة نصر، القاهرة",
    "report.submit": "إرسال البلاغ",
    "report.sent": "شكرًا — تم إبلاغ فريق مكافحة التزوير لدينا.",
    "rateLimited.title": "محاولات كثيرة جدًا",
    "rateLimited.subtitle": "من فضلك انتظر بضع دقائق قبل المحاولة مرة أخرى.",
    "error.generic": "حدث خطأ ما. حاول مرة أخرى.",
    "footer.poweredBy": "بحماية SUPSEAL",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["en"];

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectDefaultLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    setLangState(stored ?? detectDefaultLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string>) => {
      let str: string = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
