"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconChartBar,
  IconCirclePlus,
  IconLayoutGrid,
  IconList,
  IconLogout,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutGrid },
  { href: "/dashboard", label: "Session List", icon: IconList },
  { href: "/dashboard", label: "Analytics", icon: IconChartBar },
];

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isFacilitator = Boolean(user && user.role.toLowerCase() !== "siswa");
  const initials = user?.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#eef2f6] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[260px] flex-col border-r border-[#e2e8f0] bg-sidebar px-6 py-6 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-primary" />
          <span className="text-xl font-bold tracking-[-0.5px] text-[var(--ink)]">
            Qurio
          </span>
        </Link>
        {isFacilitator && (
          <Link
            href="/dashboard/createsessions"
            className={cn(
              buttonVariants(),
              "mt-10 h-[42px] w-full rounded-[10px] text-[13px] font-semibold",
            )}
          >
            <IconCirclePlus className="size-[18px]" />
            Create New Quiz
          </Link>
        )}
        <nav className="mt-10 space-y-2" aria-label="Navigasi dashboard">
          <p className="pb-1 text-xs font-semibold text-[#64748d]">Workspace</p>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex h-[42px] items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors",
                  active && label === "Dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-[#64728b] hover:bg-sidebar-accent",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-[#e2e8f0] pt-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials || "Q"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                {user?.name || "Memuat pengguna..."}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role || ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              aria-label="Keluar"
            >
              <IconLogout className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-extrabold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs text-primary-foreground">
            Q
          </span>
          Qurio
        </Link>
        <div className="flex items-center gap-1">
          {isFacilitator && (
            <Link
              href="/dashboard/createsessions"
              className={buttonVariants({ size: "sm" })}
            >
              <IconCirclePlus /> Sesi
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Keluar"
          >
            <IconLogout />
          </Button>
        </div>
      </header>
      <main className="min-h-screen lg:pl-[260px]">{children}</main>
    </div>
  );
}

export default DashboardLayout;
