import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Package,
  Percent,
  QrCode,
  ShieldAlert,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Exact page name from SUPSEAL_SRS_Focused_v1.0 §2.7, for traceability. */
  srsPages: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Every page in the SRS's Brand Admin Portal inventory maps to one of these
// nine sections — detail/create/edit screens (e.g. "Product create/edit")
// are reached from their list page, not given separate nav entries.
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, srsPages: ["Dashboard"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        srsPages: ["Product catalog list", "Product create/edit"],
      },
    ],
  },
  {
    label: "Stickers",
    items: [
      {
        label: "Sticker Batches",
        href: "/batches",
        icon: QrCode,
        srsPages: [
          "Sticker batch list",
          "Sticker batch request form",
          "Sticker batch detail / status",
        ],
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        label: "Coupons",
        href: "/coupons",
        icon: Percent,
        srsPages: ["Coupon rules configuration", "Coupon performance view"],
      },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      {
        label: "Fraud Flags",
        href: "/fraud",
        icon: ShieldAlert,
        srsPages: ["Fraud flags queue", "Fraud flag detail"],
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        label: "Support Tickets",
        href: "/support",
        icon: LifeBuoy,
        srsPages: ["Support ticket queue", "Support ticket detail"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Brand Profile",
        href: "/settings/brand",
        icon: Building2,
        srsPages: ["Brand profile settings"],
      },
      {
        label: "Subscription & Billing",
        href: "/settings/billing",
        icon: CreditCard,
        srsPages: ["Subscription & billing summary"],
      },
      {
        label: "Users",
        href: "/settings/users",
        icon: Users,
        srsPages: ["User management"],
      },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
