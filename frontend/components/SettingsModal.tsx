"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { getThemePreference, saveThemePreference } from "@/lib/db";
import { IconPalette, IconUser } from "@tabler/icons-react";

type Theme = "system" | "light" | "dark";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onApply: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  onLogout,
  onDeleteAccount,
  onApply,
}: SettingsDialogProps) {
  useEffect(() => {
    let active = true;

    void getThemePreference().then((storedTheme) => {
      if (active && storedTheme && storedTheme !== theme) {
        onThemeChange(storedTheme);
      }
    });

    return () => {
      active = false;
    };
  }, [onThemeChange, theme]);

  const handleThemeChange = (nextTheme: Theme) => {
    onThemeChange(nextTheme);
    void saveThemePreference(nextTheme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pb-5">
          <DialogTitle className="text-xl">Pengaturan</DialogTitle>
          <DialogDescription>
            Kelola akun dan tampilan aplikasi.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">
              <IconUser />
              Akun
            </TabsTrigger>
            <TabsTrigger value="theme">
              <IconPalette />
              Tema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-3 p-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div>
                <h3 className="text-sm font-semibold">Keluar dari akun</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Keluar dari akun pada perangkat ini.
                </p>
              </div>
              <Button variant="destructive" onClick={onLogout}>
                Keluar
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
              <div>
                <h3 className="text-sm font-semibold">Hapus akun</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Data akun akan dihapus secara permanen.
                </p>
              </div>
              <Button variant="destructive" onClick={onDeleteAccount}>
                Hapus akun
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="theme" className="p-6">
            <div>
              <h3 className="text-sm font-semibold">Tampilan aplikasi</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih tema yang digunakan aplikasi.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button
                  className="h-11"
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => handleThemeChange("system")}
                >
                  Sistem
                </Button>

                <Button
                  className="h-11"
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => handleThemeChange("light")}
                >
                  Terang
                </Button>

                <Button
                  className="h-11"
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => handleThemeChange("dark")}
                >
                  Gelap
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted">
            Batal
          </DialogClose>

          <Button onClick={onApply}>Terapkan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
