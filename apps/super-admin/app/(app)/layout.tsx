"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null; // redirect effect above is about to fire

  if (user.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="text-lg font-semibold">This account can&apos;t access the Super Admin console</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email} ({user.role}). This console is for SUPSEAL platform
            operators only.
          </p>
          <Button
            variant="secondary"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
