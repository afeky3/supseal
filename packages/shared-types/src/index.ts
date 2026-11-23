// Mirrors apps/platform-api's Prisma enums and response shapes. Hand-kept in
// sync for now (no OpenAPI codegen yet) — string literal unions rather than
// TS enums so this compiles to zero runtime code and matches the plain JSON
// strings Prisma actually sends over the wire.

export type UserRole = "SUPER_ADMIN" | "BRAND_ADMIN" | "BRAND_STAFF";
export type BrandStatus = "ACTIVE" | "SUSPENDED";
export type SubscriptionTier = "STARTER" | "GROWTH" | "ENTERPRISE";
export type BillingStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";
export type BatchStatus =
  | "REQUESTED" // legacy pre-approval flow, no longer created
  | "APPROVED" // legacy pre-approval flow, no longer created
  | "PROCESSING" // codes + PDF generating in the background
  | "CODES_GENERATED"
  | "SENT_TO_PRINT"
  | "SHIPPED"
  | "DELIVERED"
  | "RECONCILED"
  | "REVOKED"
  | "FAILED";
export type CodeStatus = "UNUSED" | "USED" | "REVOKED";
export type VerificationResult = "VERIFIED" | "VERIFIED_BEFORE" | "UNVERIFIED";
export type FraudSeverity = "LOW" | "MEDIUM" | "HIGH";
export type FraudStatus = "OPEN" | "RESOLVED" | "ESCALATED";
export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Brand {
  id: string;
  name: string;
  industryCategory: string;
  status: BrandStatus;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDetail extends Brand {
  _count: { products: number; users: number };
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  usageInstructions: string | null;
  imageUrl: string | null;
  supportContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StickerBatch {
  id: string;
  productId: string;
  quantity: number;
  status: BatchStatus;
  printRequested: boolean;
  requestedById: string | null;
  approvedById: string | null;
  requestedAt: string;
  approvedAt: string | null;
  codesGeneratedAt: string | null;
  pdfPath: string | null;
  failureReason: string | null;
  sentToPrintAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  reconciledAt: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
    brand?: { id: string; name: string };
  };
  _count?: { codes: number };
}

export interface DashboardKpis {
  totalStickersGenerated: number;
  totalVerifications: number;
  firstTimeVerifications: number;
  repeatVerifications: number;
  suspiciousVerifications: number;
  verificationRatePct: number;
  stickerRevenueEgp: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  charts: {
    verificationTrends: { date: string; verified: number; verifiedBefore: number; unverified: number }[];
    verificationByProduct: { product: string; count: number }[];
    verificationByRegion: { region: string; count: number }[];
    fraudInsights: { open: number; resolved: number };
    couponUsage: { issued: number; redeemed: number };
  };
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
  user: { id: string; email: string; role: UserRole } | null;
}

interface FlagVerificationContext {
  id: string;
  result: VerificationResult;
  deviceFingerprint: string | null;
  ipAddress: string | null;
  geoLocation: string | null;
  createdAt: string;
  code: {
    batch: {
      product: { id: string; name: string; brand: { id: string; name: string } };
    };
  } | null;
}

export interface FraudFlag {
  id: string;
  verificationEventId: string;
  reason: string;
  severity: FraudSeverity;
  status: FraudStatus;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  verificationEvent: FlagVerificationContext;
}

export interface Coupon {
  id: string;
  verificationEventId: string;
  code: string;
  // Prisma's Decimal serializes to a JSON string (via its own toJSON()),
  // never a number — parseFloat() before doing math or formatting with it.
  discountPct: string;
  redeemed: boolean;
  expiresAt: string;
  createdAt: string;
  verificationEvent: {
    createdAt: string;
    code: {
      batch: {
        product: { id: string; name: string; brand: { id: string; name: string } };
      };
    } | null;
  };
}

export interface CouponList {
  coupons: Coupon[];
  stats: { issued: number; redeemed: number };
}

export interface SupportTicket {
  id: string;
  brandId: string;
  codeId: string | null;
  subject: string;
  message: string | null;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  brandId: string;
  tier: SubscriptionTier;
  renewalDate: string | null;
  billingStatus: BillingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BrandSubscriptionRow {
  id: string;
  name: string;
  status: BrandStatus;
  subscription: Subscription | null;
}

export interface PlatformUser {
  id: string;
  email: string;
  role: UserRole;
  brandId: string | null;
  active: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  brand: { id: string; name: string } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  brandId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  message: string | string[];
  error?: string;
  statusCode: number;
}

// ── verification-service (public, consumer-facing) ──────────────────────

export interface VerifyProduct {
  id: string;
  name: string;
  description: string | null;
  usageInstructions: string | null;
  imageUrl: string | null;
  supportContact: string | null;
}

export interface VerifyBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
}

export interface VerifyContext {
  product: VerifyProduct;
  brand: VerifyBrand;
}

export type CheckCodeResult =
  | { outcome: "VERIFIED"; eventId: string; product: VerifyProduct; brand: VerifyBrand; couponCode: string | null }
  | { outcome: "VERIFIED_BEFORE"; eventId: string; firstVerifiedAt: string; verificationCount: number }
  | { outcome: "UNVERIFIED"; eventId: string };
