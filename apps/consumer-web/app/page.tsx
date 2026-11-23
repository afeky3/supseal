import { PageShell } from "@/components/page-shell";
import { VerificationFlow } from "@/components/verification-flow";

// Manual entry, no QR scanned (FR-VER-01) — a consumer who typed the
// verification URL directly rather than scanning a sticker.
export default function ManualEntryPage() {
  return (
    <PageShell>
      <VerificationFlow initialContext={null} />
    </PageShell>
  );
}
