"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, ApiError } from "@/contexts/auth-context";
import { getOwnBrand, updateOwnBrand, type BrandProfileInput } from "@/lib/brand";
import { toast } from "sonner";

export default function BrandProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: brand, isLoading } = useQuery({ queryKey: ["brand", "me"], queryFn: getOwnBrand });

  const [form, setForm] = useState<BrandProfileInput>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canEdit = user?.role === "BRAND_ADMIN";

  useEffect(() => {
    if (brand) {
      setForm({
        logoUrl: brand.logoUrl ?? "",
        description: brand.description ?? "",
        contactEmail: brand.contactEmail ?? "",
      });
    }
  }, [brand]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateOwnBrand({
        logoUrl: form.logoUrl || undefined,
        description: form.description || undefined,
        contactEmail: form.contactEmail || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["brand", "me"] });
      toast.success("Brand profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Brand Profile</h1>
        <p className="text-sm text-muted-foreground">
          Shown to consumers on the VERIFIED result page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{brand?.name}</CardTitle>
              <CardDescription>{brand?.industryCategory}</CardDescription>
            </div>
            <Badge variant={brand?.status === "ACTIVE" ? "default" : "destructive"}>
              {brand?.status}
            </Badge>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                disabled={!canEdit || submitting}
                value={form.logoUrl ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                disabled={!canEdit || submitting}
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                disabled={!canEdit || submitting}
                value={form.contactEmail ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            {!canEdit && (
              <p className="text-xs text-muted-foreground">
                Brand Staff accounts can view but not edit the brand profile.
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          {canEdit && (
            <CardFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
