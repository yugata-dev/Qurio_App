"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";
import {
  IconChartBar,
  IconCirclePlus,
  IconLayoutGrid,
  IconList,
  IconMenu2,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SettingsDialog } from "@/components/SettingsModal";
import { Toaster } from "@/components/ui/toast"; // ← ✨ TAMBAHKAN INI
import LogoQurio from "../../public/Qurio-Cropped.svg";

const navigation = [
  { href: "/dashboard", label: "Dashboard", Icon: IconLayoutGrid },
  { href: "/sessions", label: "Session List", Icon: IconList },
  { href: "/analytics", label: "Analytics", Icon: IconChartBar },
];

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        <Link href="/dashboard" className="flex justify-center items-center px-2 py-1 shrink-0">
          <Image
            src={LogoQurio}
            alt="Logo Qurio"
            className="h-[50px] w-auto object-contain object-left"
            priority
          />
        </Link>
        {isFacilitator && (
          <Link
            href="/dashboard/createsessions"
            className={cn(
              buttonVariants(),
              "mt-5 h-[42px] w-full rounded-[10px] text-[13px] font-semibold",
            )}
          >
            <IconCirclePlus className="size-[18px]" />
            Buat Sesi Baru
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
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (active) event.preventDefault();
                }}
                className={cn(
                  "flex h-[42px] items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors",
                  active
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
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Pengaturan"
              onClick={() => setSettingsOpen(true)}
            >
              <IconSettings className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/dashboard" aria-label="Qurio, ke Dashboard">
            <Image
              src={LogoQurio}
              alt="Logo Qurio"
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu navigasi"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <IconMenu2 className="size-5" />
        </Button>
      </header>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Tutup menu navigasi"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-sidebar-border bg-sidebar px-5 py-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src={LogoQurio}
                  alt="Logo Qurio"
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tutup menu navigasi"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <IconX className="size-5" />
              </Button>
            </div>
            {isFacilitator && (
              <Link
                href="/dashboard/createsessions"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  buttonVariants(),
                  "mt-7 h-[42px] w-full rounded-[10px] text-[13px] font-semibold",
                )}
              >
                <IconCirclePlus className="size-[18px]" />
                Buat Sesi Baru
              </Link>
            )}
            <nav className="mt-7 space-y-2" aria-label="Navigasi dashboard">
              <p className="pb-1 text-xs font-semibold text-[#64748d]">Workspace</p>
              {navigation.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex h-[42px] items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors",
                      active
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
            <div className="mt-auto flex items-center gap-3 border-t border-sidebar-border pt-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials || "Q"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name || "Memuat pengguna..."}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.role || ""}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Pengaturan"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <IconSettings className="size-4" />
              </Button>
            </div>
          </aside>
        </div>
      )}
      <main className="min-h-screen pb-4 lg:pl-65 lg:pb-0">{children}</main>

      {/* ✨ TAMBAHKAN INI — supaya semua toast.add() bisa tampil */}
      <Toaster />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme === "dark" ? "dark" : "light"}
        onThemeChange={setTheme}
        onLogout={logout}
        onApply={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default DashboardLayout;
