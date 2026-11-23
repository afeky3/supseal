import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
      </CardContent>
    </Card>
  );
}
