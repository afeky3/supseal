"use client";

import type { Product } from "@supseal/shared-types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/contexts/auth-context";
import type { ProductInput } from "@/lib/products";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (input: ProductInput) => Promise<void>;
}

const EMPTY: ProductInput = {
  name: "",
  sku: "",
  category: "",
  description: "",
  usageInstructions: "",
  imageUrl: "",
  supportContact: "",
};

export function ProductDialog({ open, onOpenChange, product, onSubmit }: ProductDialogProps) {
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        product
          ? {
              name: product.name,
              sku: product.sku,
              category: product.category,
              description: product.description ?? "",
              usageInstructions: product.usageInstructions ?? "",
              imageUrl: product.imageUrl ?? "",
              supportContact: product.supportContact ?? "",
            }
          : EMPTY,
      );
    }
  }, [open, product]);

  function field(key: keyof ProductInput) {
    return {
      value: form[key] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: ProductInput = {
        ...form,
        description: form.description || undefined,
        usageInstructions: form.usageInstructions || undefined,
        imageUrl: form.imageUrl || undefined,
        supportContact: form.supportContact || undefined,
      };
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update this product's catalog details."
              : "Add a product to your catalog before requesting sticker batches for it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required disabled={submitting} {...field("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" required disabled={submitting} {...field("sku")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              required
              placeholder="e.g. supplements, cosmetics, perfumes"
              disabled={submitting}
              {...field("category")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} disabled={submitting} {...field("description")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usageInstructions">Usage instructions</Label>
            <Textarea
              id="usageInstructions"
              rows={2}
              disabled={submitting}
              {...field("usageInstructions")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" type="url" disabled={submitting} {...field("imageUrl")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportContact">Support contact</Label>
              <Input id="supportContact" disabled={submitting} {...field("supportContact")} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {product ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
