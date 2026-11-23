"use client";

import type { Brand, UserRole } from "@supseal/shared-types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/contexts/auth-context";
import type { CreateUserInput } from "@/lib/users";

export function CreateUserDialog({
  open,
  onOpenChange,
  brands,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: Brand[];
  onSubmit: (input: CreateUserInput) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("BRAND_ADMIN");
  const [brandId, setBrandId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setRole("BRAND_ADMIN");
      setBrandId(brands[0]?.id ?? "");
      setError(null);
    }
  }, [open, brands]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (role !== "SUPER_ADMIN" && !brandId) {
      setError("Choose a brand for this role");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        email,
        password,
        role,
        brandId: role === "SUPER_ADMIN" ? undefined : brandId,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>
            There&apos;s no email invite flow yet — share this password with them directly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              disabled={submitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="text"
              required
              minLength={8}
              disabled={submitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="BRAND_ADMIN">Brand Admin</SelectItem>
                <SelectItem value="BRAND_STAFF">Brand Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role !== "SUPER_ADMIN" && (
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={(v) => setBrandId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
