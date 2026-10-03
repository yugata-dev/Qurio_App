"use client";

import { useEffect, useState } from "react";
import {
  IconDotsVertical,
  IconExternalLink,
  IconPlayerPlay,
  IconPlayerStop,
  IconShare,
  IconSearch,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteSession,
  getSessionList,
  updateStatusSession,
  type SessionListItem,
} from "@/lib/api";
import smartSearch from "@/lib/smart-search";
import { toast } from "@/components/ui/toast";

// Format tanggal dari API menggunakan lokal Indonesia.
function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DashboardPage() {
  // State untuk data sesi, pencarian, dan kondisi pemuatan.
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [updatingSessionIds, setUpdatingSessionIds] = useState<string[]>([]);
  const [sessionToDelete, setSessionToDelete] =
    useState<SessionListItem | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tunda pencarian agar pemrosesan tidak berjalan pada setiap ketikan.
  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Muat sesi pengguna sekali saat halaman dashboard dibuka.
  useEffect(() => {
    let isMounted = true;

    getSessionList()
      .then((sessionList) => {
        if (isMounted) setSessions(sessionList);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Sesi gagal dimuat",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Hanya tampilkan sesi yang berstatus aktif.
  const activeSessions = sessions.filter(
    (session) => session.status === "active",
  );
  const endedSessionsCount = sessions.length - activeSessions.length;

  // Kartu ringkasan: sesi aktif didahulukan karena paling relevan.
  const overviewItems = [
    {
      label: "Sesi Aktif",
      value: String(activeSessions.length),
      detail: "Sedang berlangsung sekarang",
    },
    {
      label: "Total Sesi",
      value: String(sessions.length),
      detail: "Semua sesi yang pernah dibuat",
    },
    {
      label: "Sesi Selesai",
      value: String(endedSessionsCount),
      detail: "Sudah diakhiri",
    },
  ];

  // Terapkan pencarian fuzzy hanya pada sesi aktif.
  const searchedSessions = debouncedSearchQuery.trim()
    ? smartSearch(
      activeSessions,
      debouncedSearchQuery,
      (session) => `${session.title}`,
    )
      .filter((result) => result.matchedWords > 0)
      .map((result) => result.item)
    : activeSessions;

  const visibleSessions = searchedSessions;

  const toggleSessionStatus = async (session: SessionListItem) => {
    const nextStatus = session.status === "active" ? "ended" : "active";
    setUpdatingSessionIds((current) => [...current, session.id]);
    setActionErrorMessage(null);

    try {
      await updateStatusSession(session.id, nextStatus, null);
      setSessions((current) =>
        current.map((item) =>
          item.id === session.id
            ? {
              ...item,
              status: nextStatus,
              ended_at:
                nextStatus === "ended" ? new Date().toISOString() : null,
            }
            : item,
        ),
      );
      toast.add({
        title:
          nextStatus === "ended"
            ? "Sesi diakhiri"
            : "Sesi diaktifkan kembali",
        description: `Sesi "${session.title}" berhasil diperbarui.`,
        type: "success",
      });
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : "Gagal mengubah status sesi.",
      );
    } finally {
      setUpdatingSessionIds((current) =>
        current.filter((id) => id !== session.id),
      );
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    setDeletingSessionId(sessionToDelete.id);
    setActionErrorMessage(null);

    try {
      await deleteSession(sessionToDelete.id);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionToDelete.id),
      );
      toast.add({
        title: "Sesi berhasil dihapus",
        description: `Sesi "${sessionToDelete.title}" telah dihapus permanen.`,
        type: "success",
      });
      setSessionToDelete(null);
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : "Gagal menghapus sesi.",
      );
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Handler "Bagikan undangan" dengan Web Share API + fallback clipboard.
  const shareSession = async (session: SessionListItem) => {
    const url = new URL(
      `/play/${session.id}`,
      window.location.origin,
    ).toString();
    const message =
      `Halo! Silakan bergabung ke sesi "${session.title}" di Qurio.\n\n` +
      `Kode akses: ${session.access_code}\n` +
      `Tautan: ${url}`;

    // 1. Coba Web Share API (biasanya di HP).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Sesi Qurio: ${session.title}`,
          text: message,
          url,
        });
        return;
      } catch (error) {
        // User membatalkan share → jangan tampilkan error apa pun.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Gagal karena alasan lain → lanjut ke fallback clipboard.
      }
    }

    // 2. Fallback: salin ke clipboard.
    try {
      await navigator.clipboard.writeText(message);
      toast.add({
        title: "Undangan tersalin",
        description: "Link dan kode akses siap dibagikan ke siswa.",
        type: "success",
      });
    } catch {
      setActionErrorMessage(
        "Gagal menyalin undangan. Salin kode akses secara manual.",
      );
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      {/* Header halaman. */}
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau sesi aktif dan kelola aktivitas kelas Qurio Anda
        </p>
      </header>

      {/* Kartu ringkasan aktivitas sesi. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overviewItems.map(({ label, value, detail }) => (
          <Card
            key={label}
            className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none"
          >
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-[28px] font-bold tracking-tight text-foreground">
                {value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Panel daftar sesi aktif. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardContent className="flex flex-col p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Sesi Aktif
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeSessions.length} sesi sedang berlangsung
              </p>
            </div>
          </div>

          {/* Kolom pencarian. */}
          <div className="relative mt-4 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-full border-0 bg-muted pl-10 shadow-none"
              placeholder="Cari sesi aktif berdasarkan nama..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                aria-label="Hapus pencarian"
                title="Hapus pencarian"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearchQuery("");
                }}
              >
                <IconX className="size-4" />
              </Button>
            )}
          </div>

          {actionErrorMessage && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {actionErrorMessage}
            </p>
          )}

          {/* Tabel sesi aktif. */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[760px] text-left">
              <TableHeader className="bg-muted text-muted-foreground">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3 font-semibold">
                    Nama sesi
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Kode akses
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-semibold">
                    Peserta
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Dibuat
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right font-semibold">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* State: sedang memuat. */}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Memuat sesi aktif...
                    </TableCell>
                  </TableRow>
                )}

                {/* State: error memuat data. */}
                {!isLoading && errorMessage && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-destructive"
                    >
                      {errorMessage}
                    </TableCell>
                  </TableRow>
                )}

                {/* State: tidak ada sesi aktif. */}
                {!isLoading &&
                  !errorMessage &&
                  visibleSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            {debouncedSearchQuery.trim()
                              ? "Tidak ada sesi aktif yang cocok dengan pencarian."
                              : "Belum ada sesi aktif saat ini."}
                          </p>
                          {!debouncedSearchQuery.trim() && (
                            <Link
                              href="/dashboard/createsessions"
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              Buat sesi baru →
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                {/* Baris data sesi aktif. */}
                {!isLoading &&
                  !errorMessage &&
                  visibleSessions.map((session) => (
                    <TableRow key={session.id}>
                      {/* Nama sesi + indikator aktif. */}
                      <TableCell className="px-4 py-3.5">
                        <Link
                          href={`/dashboard/session/${session.id}`}
                          className="group inline-flex items-center gap-2"
                        >
                          <span
                            className="size-2 shrink-0 rounded-full bg-emerald-500"
                            aria-hidden="true"
                          />
                          <span className="font-medium text-foreground transition-colors group-hover:text-primary group-hover:underline">
                            {session.title}
                          </span>
                        </Link>
                      </TableCell>

                      {/* Kode akses + tombol salin. */}
                      <TableCell className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-base font-bold tracking-wider text-foreground">
                            {session.access_code}
                          </span>
                          <CopyButton
                            text={session.access_code}
                            label="kode akses"
                          />
                        </div>
                      </TableCell>

                      {/* Jumlah peserta. */}
                      <TableCell className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <IconUsers className="size-4" />
                          <span className="font-semibold text-foreground">
                            {session.participant_count ?? 0}
                          </span>
                        </span>
                      </TableCell>

                      {/* Waktu dibuat. */}
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                        {formatDate(session.created_at)}
                      </TableCell>

                      {/* Kolom aksi: share + dropdown. */}
                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Bagikan undangan sesi ${session.title}`}
                            title="Bagikan undangan sesi"
                            onClick={() => void shareSession(session)}
                          >
                            <IconShare className="size-4 text-muted-foreground" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={`Aksi lain untuk sesi ${session.title}`}
                                >
                                  <IconDotsVertical className="size-4 text-muted-foreground" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                render={
                                  <Link
                                    href={`/dashboard/session/${session.id}`}
                                  />
                                }
                              >
                                <IconExternalLink className="size-4" />
                                Buka sesi
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={updatingSessionIds.includes(
                                  session.id,
                                )}
                                onClick={() =>
                                  void toggleSessionStatus(session)
                                }
                              >
                                {session.status === "active" ? (
                                  <IconPlayerStop className="size-4" />
                                ) : (
                                  <IconPlayerPlay className="size-4" />
                                )}
                                {session.status === "active"
                                  ? "Akhiri sesi"
                                  : "Aktifkan sesi"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setSessionToDelete(session)}
                              >
                                <IconTrash className="size-4" />
                                Hapus sesi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog konfirmasi hapus sesi. */}
      <AlertDialog
        open={sessionToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingSessionId) setSessionToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus sesi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Sesi "{sessionToDelete?.title}" beserta seluruh data terkait
              (respons siswa, pertanyaan, dan hasil) akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSessionId !== null}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletingSessionId !== null}
              onClick={() => void confirmDeleteSession()}
            >
              {deletingSessionId ? "Menghapus..." : "Ya, hapus sesi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default DashboardPage;
