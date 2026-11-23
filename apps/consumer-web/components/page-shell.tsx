import { FooterText } from "@/components/footer-text";
import { LanguageToggle } from "@/components/language-toggle";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#6fd6f5] text-xs font-bold text-primary-foreground shadow-(--shadow-button)">
            SS
          </div>
          <span className="text-sm font-semibold">SUPSEAL</span>
        </div>
        <LanguageToggle />
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <FooterText />
      </footer>
    </div>
  );
}
