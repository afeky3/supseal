"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateBrandDialog } from "@/components/create-brand-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createBrand, listBrands, type CreateBrandInput } from "@/lib/brands";
import { toast } from "sonner";

export default function BrandsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: brands, isLoading } = useQuery({ queryKey: ["brands"], queryFn: listBrands });
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleCreate(input: CreateBrandInput) {
    await createBrand(input);
    toast.success("Brand created");
    await queryClient.invalidateQueries({ queryKey: ["brands"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground">Every client brand on the platform.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New brand
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !brands || brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">No brands yet</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Onboard the first client brand to get started.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/brands/${brand.id}`)}
                >
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground">{brand.industryCategory}</TableCell>
                  <TableCell>
                    <Badge variant={brand.status === "ACTIVE" ? "default" : "destructive"}>
                      {brand.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateBrandDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
    </div>
  );
}
