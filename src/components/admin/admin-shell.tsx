"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";

const NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard" }] },
  {
    group: "Orders",
    items: [
      { href: "/admin/orders", label: "All Orders" },
      { href: "/admin/orders?status=processing", label: "Processing" },
      { href: "/admin/orders?status=shipped", label: "Shipped" },
      { href: "/admin/orders?status=refunded", label: "Refunds" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/products/new", label: "Add Product" },
      { href: "/admin/collections", label: "Collections" },
      { href: "/admin/import", label: "Import / Export" },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/discounts", label: "Discounts" },
      { href: "/admin/shipping", label: "Shipping" },
      { href: "/admin/tax", label: "Taxes" },
      { href: "/admin/payments", label: "Payments" },
    ],
  },
  {
    group: "Growth",
    items: [
      { href: "/admin/content", label: "Content" },
      { href: "/admin/marketing", label: "Marketing" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/seo", label: "SEO" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/staff", label: "Staff" },
      { href: "/admin/notifications", label: "Notifications" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/system", label: "System Health" },
    ],
  },
];

export function AdminShell({
  children,
  user,
  unreadCount,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
  unreadCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/admin/orders") return pathname === "/admin/orders" && href.includes("status") === false;
    return pathname === base;
  };

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-[#e2e6e2] bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <button className="grid size-9 place-items-center lg:hidden" onClick={() => setOpen(true)} aria-label="Open admin menu">
            <MenuIcon />
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-sm bg-forest text-[0.75rem] font-bold text-white">SJ</span>
            <span className="hidden text-[0.8rem] font-bold uppercase tracking-[0.16em] sm:block">Golf Store Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft hover:text-ink sm:block"
            >
              View store ↗
            </Link>
            <Link href="/account" className="hidden text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft hover:text-ink sm:block">
              My account
            </Link>
            <Link href="/admin/notifications" className="relative grid size-9 place-items-center" aria-label="Notifications">
              <BellIcon />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-forest text-[0.6rem] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
            <div className="flex items-center gap-2 border-l border-[#e2e6e2] pl-3">
              <span className="grid size-8 place-items-center rounded-full bg-forest/10 text-xs font-semibold text-forest">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-semibold">{user.name}</span>
                <span className="block text-[0.65rem] text-ink-soft">{user.role}</span>
              </span>
            </div>
            <form action={logoutAction} className="hidden sm:block">
              <button type="submit" className="text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-y-auto border-r border-[#e2e6e2] bg-white pt-3 transition-transform lg:sticky lg:top-14 lg:z-0 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "lg:w-16" : "lg:w-64"}`}
        >
          <div className="flex items-center justify-between px-4 pb-2">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-ink-soft">Navigation</span>
            <button onClick={() => setCollapsed((c) => !c)} className="hidden text-xs text-ink-soft hover:text-ink lg:block">
              {collapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="pb-10">
            {NAV.map((group) => (
              <div key={group.group} className="mt-3">
                {!collapsed ? (
                  <p className="px-4 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">{group.group}</p>
                ) : (
                  <div className="mx-4 my-2 border-t border-[#eef1ee]" />
                )}
                <ul>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-2 text-[0.82rem] transition ${
                          isActive(item.href)
                            ? "border-r-2 border-forest bg-forest/[0.06] font-semibold text-forest"
                            : "text-ink-soft hover:bg-[#f6f7f6] hover:text-ink"
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {open ? (
          <button aria-label="Close menu" className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function MenuIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>;
}
