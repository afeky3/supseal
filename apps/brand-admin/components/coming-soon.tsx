import { Construction } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ title, srsPages }: { title: string; srsPages: string[] }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
          <Construction className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">{title} is under construction</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            This section is planned but not built yet — it&apos;ll ship in an upcoming phase.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {srsPages.map((page) => (
            <Badge key={page} variant="secondary" className="font-normal">
              {page}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
