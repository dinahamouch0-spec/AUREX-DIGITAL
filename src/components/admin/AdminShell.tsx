"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  Package,
  Layers,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  adminEmail,
}: {
  children: React.ReactNode;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-brand-line bg-white lg:flex">
        <SidebarContent pathname={pathname} adminEmail={adminEmail} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 bg-white shadow-xl">
            <SidebarContent
              pathname={pathname}
              adminEmail={adminEmail}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="grow bg-black/30"
          />
        </div>
      )}

      <div className="flex min-w-0 grow flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-brand-line bg-white px-4 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-ivory-deep"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="font-bold text-brand-navy">Ya 7kayti Admin</span>
        </header>
        <main className="grow p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  adminEmail,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  adminEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-brand-line p-4">
        <span className="flex items-center gap-2 font-bold text-brand-navy">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-purple text-white">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          Ya 7kayti
        </span>
        {onNavigate && (
          <button aria-label="Close" onClick={onNavigate} className="lg:hidden">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex grow flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-blush text-brand-pink-deep"
                  : "text-brand-navy-soft hover:bg-ivory-deep hover:text-brand-navy"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-line p-3">
        {adminEmail && <p className="truncate px-3 pb-2 text-xs text-brand-navy-soft">{adminEmail}</p>}
        <button
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-brand-navy-soft hover:bg-ivory-deep hover:text-brand-pink-deep"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log Out
        </button>
      </div>
    </div>
  );
}
