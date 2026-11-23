"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { ApiError } from "@/contexts/auth-context";
import {
  getBrand,
  reinstateBrand,
  suspendBrand,
  updateBrand,
  type UpdateBrandInput,
} from "@/lib/brands";
import { toast } from "sonner";

export default function BrandDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: brand, isLoading } = useQuery({
    queryKey: ["brands", params.id],
    queryFn: () => getBrand(params.id),
  });

  const [form, setForm] = useState<UpdateBrandInput>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (brand) {
      setForm({
        name: brand.name,
        industryCategory: brand.industryCategory,
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
      await updateBrand(params.id, {
        ...form,
        description: form.description || undefined,
        contactEmail: form.contactEmail || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["brands", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus() {
    if (!brand) return;
    setStatusUpdating(true);
    try {
      if (brand.status === "ACTIVE") {
        await suspendBrand(brand.id);
        toast.success(`${brand.name} suspended`);
      } else {
        await reinstateBrand(brand.id);
        toast.success(`${brand.name} reinstated`);
      }
      await queryClient.invalidateQueries({ queryKey: ["brands", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["brands"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update status");
    } finally {
      setStatusUpdating(false);
    }
  }

  if (isLoading || !brand) {
    return (
      <div className="max-w-lg space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/brands"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Brands
        </Link>
        <h1 className="text-lg font-semibold">{brand.name}</h1>
        <p className="text-sm text-muted-foreground">
          {brand._count.products} product{brand._count.products === 1 ? "" : "s"} ·{" "}
          {brand._count.users} user{brand._count.users === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Details</CardTitle>
            <Badge variant={brand.status === "ACTIVE" ? "default" : "destructive"}>
              {brand.status}
            </Badge>
          </div>
          <CardDescription>Edit this brand&apos;s profile or change its status.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                disabled={submitting}
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industryCategory">Industry category</Label>
              <Input
                id="industryCategory"
                required
                disabled={submitting}
                value={form.industryCategory ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, industryCategory: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                disabled={submitting}
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                disabled={submitting}
                value={form.contactEmail ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={statusUpdating}
              onClick={toggleStatus}
            >
              {statusUpdating && <Loader2 className="size-4 animate-spin" />}
              {brand.status === "ACTIVE" ? "Suspend brand" : "Reinstate brand"}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
