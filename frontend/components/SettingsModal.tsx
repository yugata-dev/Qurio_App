"use client";

import { useEffect, useState } from "react";
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
import { IconLogout, IconPalette, IconUser } from "@tabler/icons-react";

type Theme = "light" | "dark";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onLogout: () => void;
  onApply: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  onLogout,
  onApply,
}: SettingsDialogProps) {
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);
  const [activeTab, setActiveTab] = useState<"account" | "theme">("account");

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    getThemePreference().then((storedTheme) => {
      if (active && storedTheme) {
        setDraftTheme(storedTheme);
      }
    });

    return () => {
      active = false;
    };
  }, [open, theme]);

  const handleDraftThemeChange = (nextTheme: Theme) => {
    setDraftTheme(nextTheme);
  };

  const handleCancel = () => {
    setDraftTheme(theme);
  };

  const handleApply = () => {
    onThemeChange(draftTheme);
    saveThemePreference(draftTheme);
    onApply();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    handleCancel();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent>
        <DialogHeader className="pb-5">
          <DialogTitle className="text-xl">Pengaturan</DialogTitle>
          <DialogDescription>
            Kelola akun dan tampilan aplikasi.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="account"
          onValueChange={(value) => setActiveTab(value as "account" | "theme")}
        >
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

          <TabsContent value="account" className="mt-0 px-0 pt-5">
            <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/80 to-background p-4 dark:border-rose-900/60 dark:from-rose-950/30 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <IconLogout className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Keluar dari akun
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Keluar dari akun pada perangkat ini.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="min-h-11 w-full shrink-0 sm:w-auto"
                  onClick={onLogout}
                >
                  <IconLogout className="size-4" aria-hidden="true" />
                  Keluar
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="theme" className="p-6">
            <div>
              <h3 className="text-sm font-semibold">Tampilan aplikasi</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih tema yang digunakan aplikasi.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  className="h-11"
                  variant={draftTheme === "light" ? "default" : "outline"}
                  onClick={() => handleDraftThemeChange("light")}
                >
                  Terang
                </Button>

                <Button
                  className="h-11"
                  variant={draftTheme === "dark" ? "default" : "outline"}
                  onClick={() => handleDraftThemeChange("dark")}
                >
                  Gelap
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-1 gap-3">
          <DialogClose
            className="inline-flex h-11 min-w-28 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            onClick={handleCancel}
          >
            Batal
          </DialogClose>

          {activeTab === "theme" && (
            <Button className="h-11 min-w-28 rounded-xl px-4" onClick={handleApply}>
              Terapkan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
