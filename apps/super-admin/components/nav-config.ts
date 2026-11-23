import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  FileSearch,
  LayoutDashboard,
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

// Every page in the SRS's Super Admin Portal inventory maps to one of these
// seven sections — detail/create/edit/export screens are reached from
// their list page, not given separate nav entries.
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        srsPages: ["Platform dashboard"],
      },
    ],
  },
  {
    label: "Brands",
    items: [
      {
        label: "Brands",
        href: "/brands",
        icon: Building2,
        srsPages: ["Brand list", "Brand create/edit", "Brand detail"],
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
          "Sticker batch approval queue",
          "Sticker batch detail / reconciliation",
          "Print-file export screen",
        ],
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
        srsPages: ["Fraud flags queue (platform-wide)", "Fraud flag detail"],
      },
    ],
  },
  {
    label: "Billing",
    items: [
      {
        label: "Subscriptions",
        href: "/subscriptions",
        icon: CreditCard,
        srsPages: ["Subscription management"],
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        srsPages: ["User management (all roles)"],
      },
      {
        label: "Audit Log",
        href: "/audit-log",
        icon: FileSearch,
        srsPages: ["Audit log search"],
      },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
