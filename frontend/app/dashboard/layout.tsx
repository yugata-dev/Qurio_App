"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  IconChartBar,
  IconCirclePlus,
  IconLayoutGrid,
  IconList,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/SettingsModal";

const navigation = [
  { href: "/dashboard", label: "Dashboard", Icon: IconLayoutGrid },
  { href: "/dashboard", label: "Session List", Icon: IconList },
  { href: "/dashboard", label: "Analytics", Icon: IconChartBar },
];

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isFacilitator = Boolean(user && user.role.toLowerCase() !== "siswa");
  const initials = user?.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-65 flex-col border-r border-sidebar-border bg-sidebar px-6 py-6 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="size-3 rounded-full bg-primary" />
          <span className="text-xl font-bold tracking-[-0.5px] text-foreground">
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
          {navigation.map(({ href, label, Icon }) => {
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
        <div className="mt-auto cursor-pointer border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary select-none">
              {initials || "Q"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.name || "Memuat pengguna..."}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.role || ""}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Pengaturan" onClick={() => setSettingsOpen(true)}>
              <IconSettings className="size-4" />
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
              className={buttonVariants({ size: "default" })}
            >
              Sesi <IconCirclePlus />
            </Link>
          )}
          <Button variant="ghost" size="icon" aria-label="Pengaturan" onClick={() => setSettingsOpen(true)}>
            <IconSettings />
          </Button>
        </div>
      </header>
      <main className="min-h-screen lg:pl-65">{children}</main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme === "light" || theme === "dark" ? theme : "system"}
        onThemeChange={setTheme}
        onLogout={logout}
        onDeleteAccount={() => undefined}
        onApply={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default DashboardLayout;
