"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Boxes,
  ChevronLeft,
  FolderTree,
  Gauge,
  Heart,
  Link2,
  Menu,
  MessageSquare,
  PackageCheck,
  Settings,
  ShoppingBag,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import type { AuthenticatedAdmin, AdminPermission } from "@/lib/admin/auth";

const navigation: {
  label: string;
  href: string;
  icon: typeof Gauge;
  permission: AdminPermission;
}[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: Gauge,
    permission: "dashboard:read",
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Boxes,
    permission: "products:read",
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    permission: "categories:read",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    permission: "orders:read",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: Users,
    permission: "customers:read",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: MessageSquare,
    permission: "reviews:read",
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: TicketPercent,
    permission: "coupons:read",
  },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: Heart,
    permission: "testimonials:read",
  },
  {
    label: "Social links",
    href: "/admin/social",
    icon: Link2,
    permission: "social:read",
  },
  {
    label: "Store settings",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings:read",
  },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: AuthenticatedAdmin;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const visibleNavigation = navigation.filter((entry) =>
    admin.permissions.includes(entry.permission),
  );

  async function signOut() {
    setBusy(true);
    setSignOutError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed. Please retry.");
      router.replace("/admin-login");
      router.refresh();
    } catch {
      setSignOutError("Sign out failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-warm-ivory)] text-[var(--color-botanical-charcoal)]">
      {menuOpen ? (
        <button
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-[var(--color-forest-olive)]/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-[var(--color-natural-beige)] bg-[var(--color-forest-olive)] text-white transition-transform duration-200 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/admin"
            className="leading-tight"
            onClick={() => setMenuOpen(false)}
          >
            <span className="font-display block text-xl">Dr. Golechas</span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.2em] text-[var(--color-herbal-gold)] uppercase">
              Admin workspace
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="rounded p-2 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav
          aria-label="Admin navigation"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {visibleNavigation.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded px-3 text-sm transition-colors ${active ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-semibold">{admin.name}</p>
          <p className="mt-1 truncate text-xs text-white/60 capitalize">
            {admin.role.replace("superadmin", "Super Admin")}
          </p>
          <button
            onClick={() => void signOut()}
            disabled={busy}
            className="mt-3 flex min-h-10 w-full items-center gap-2 rounded px-2 text-left text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <PackageCheck size={15} />
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-[var(--color-natural-beige)] bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-10 place-items-center rounded border border-[var(--color-natural-beige)] lg:hidden"
            >
              {menuOpen ? <ChevronLeft size={19} /> : <Menu size={19} />}
            </button>
            <p className="hidden text-xs font-semibold tracking-[0.14em] text-[var(--color-forest-olive)] uppercase sm:block">
              Store management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[var(--color-warm-ivory)] text-xs font-bold text-[var(--color-herbal-gold)]">
              {admin.name
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <span className="hidden max-w-48 truncate text-sm font-medium sm:block">
              {admin.email}
            </span>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4.5rem)] max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
          {signOutError ? (
            <p
              role="alert"
              className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {signOutError}
            </p>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
