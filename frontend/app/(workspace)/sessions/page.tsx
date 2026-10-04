"use client";

import { useEffect, useState } from "react";
import {
  IconChevronDown,
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
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

// Format tanggal dari API menggunakan lokal Indonesia.
function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusFilterLabel(statusFilter: SessionListItem["status"] | null) {
  if (statusFilter === null) return "Semua status";
  return statusFilter === "active" ? "Aktif" : "Selesai";
}

function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    SessionListItem["status"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [updatingSessionIds, setUpdatingSessionIds] = useState<string[]>([]);
  const [sessionToDelete, setSessionToDelete] =
    useState<SessionListItem | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

  // Tunda pencarian agar pemrosesan tidak berjalan pada setiap ketikan.
  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => window.clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Muat seluruh sesi pengguna sekali saat halaman dibuka.
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

  const activeSessionsCount = sessions.filter(
    (session) => session.status === "active",
  ).length;
  const endedSessionsCount = sessions.filter(
    (session) => session.status === "ended",
  ).length;

  const overviewItems = [
    {
      label: "Total Sesi",
      value: String(sessions.length),
      detail: "Semua sesi yang pernah dibuat",
    },
    {
      label: "Sesi Aktif",
      value: String(activeSessionsCount),
      detail: "Sedang berlangsung",
    },
    {
      label: "Sesi Selesai",
      value: String(endedSessionsCount),
      detail: "Sudah diakhiri",
    },
  ];

  const searchedSessions = debouncedSearchQuery.trim()
    ? smartSearch(
      sessions,
      debouncedSearchQuery,
      (session) => `${session.title} ${session.access_code}`,
    )
      .filter((result) => result.matchedWords > 0)
      .map((result) => result.item)
    : sessions;

  const visibleSessions = searchedSessions.filter(
    (session) => statusFilter === null || statusFilter === session.status,
  );
  const statusFilterLabel = getStatusFilterLabel(statusFilter);
  const hasFilterOrSearch =
    debouncedSearchQuery.trim().length > 0 || statusFilter !== null;

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
          nextStatus === "ended" ? "Sesi diakhiri" : "Sesi diaktifkan kembali",
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
          Semua Sesi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola, cari, dan bagikan seluruh sesi kelas Qurio Anda
        </p>
      </header>

      {/* Kartu ringkasan sesi. */}
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

      {/* Panel daftar seluruh sesi. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardContent className="flex flex-col p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">
              Daftar Sesi
            </h2>
            <p className="text-xs text-muted-foreground">
              {hasFilterOrSearch
                ? `${visibleSessions.length} dari ${sessions.length} sesi cocok`
                : `${sessions.length} sesi tersimpan`}
            </p>
          </div>

          {/* Baris kontrol: pencarian + filter status. */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-full border-0 bg-muted pl-10 shadow-none"
                placeholder="Cari nama sesi atau kode akses..."
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

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="h-11 justify-between border-border px-4 text-muted-foreground sm:w-[200px]"
                  >
                    {statusFilterLabel}
                    <IconChevronDown className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Status sesi</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter ?? "all"}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setStatusFilter(null);
                      } else if (value === "active" || value === "ended") {
                        setStatusFilter(value);
                      }
                    }}
                  >
                    <DropdownMenuRadioItem value="all">
                      Semua status
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="active">
                      Aktif
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ended">
                      Selesai
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {actionErrorMessage && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {actionErrorMessage}
            </p>
          )}

          {/* Tabel sesi. */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[820px] text-left">
              <TableHeader className="bg-muted text-muted-foreground">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3 font-semibold">
                    Nama sesi
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Kode akses
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-semibold">
                    Siswa
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Dibuat
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Status
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
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Memuat sesi...
                    </TableCell>
                  </TableRow>
                )}

                {/* State: error memuat data. */}
                {!isLoading && errorMessage && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-destructive"
                    >
                      {errorMessage}
                    </TableCell>
                  </TableRow>
                )}

                {/* State: hasil filter kosong. */}
                {!isLoading &&
                  !errorMessage &&
                  visibleSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
                          <p className="text-sm text-muted-foreground">
                            {hasFilterOrSearch
                              ? "Tidak ada sesi yang cocok dengan pencarian atau filter Anda."
                              : "Belum ada sesi yang dibuat."}
                          </p>
                          {hasFilterOrSearch ? (
                            <button
                              type="button"
                              className="text-sm font-semibold text-primary hover:underline"
                              onClick={() => {
                                setSearchQuery("");
                                setDebouncedSearchQuery("");
                                setStatusFilter(null);
                              }}
                            >
                              Reset filter →
                            </button>
                          ) : (
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

                {/* Baris data sesi. */}
                {!isLoading &&
                  !errorMessage &&
                  visibleSessions.map((session) => {
                    const isActive = session.status === "active";
                    return (
                      <TableRow key={session.id}>
                        {/* Nama sesi + dot indikator. */}
                        <TableCell className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/session/${session.id}`}
                              className="group inline-flex items-center gap-2"
                            >
                              <span
                                className={
                                  isActive
                                    ? "size-2 shrink-0 rounded-full bg-emerald-500"
                                    : "size-2 shrink-0 rounded-full bg-muted-foreground/40"
                                }
                                aria-hidden="true"
                              />
                              <span className="font-medium text-foreground transition-colors group-hover:text-primary group-hover:underline">
                                {session.title}
                              </span>
                            </Link>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 text-[10px] font-semibold",
                                session.mode === "quiz"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                              )}
                            >
                              {session.mode === "quiz" ? "📊 Quiz" : "💬 Interaktif"}
                            </Badge>
                          </div>
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

                        {/* Jumlah siswa. */}
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

                        {/* Status: badge + subteks tanggal berakhir. */}
                        <TableCell className="px-4 py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={
                                isActive
                                  ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                                  : "rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                              }
                            >
                              {isActive ? "Aktif" : "Selesai"}
                            </span>
                            {!isActive && session.ended_at && (
                              <span className="text-[11px] text-muted-foreground">
                                {formatDate(session.ended_at)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Aksi: share + dropdown. */}
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
                                  {isActive ? (
                                    <IconPlayerStop className="size-4" />
                                  ) : (
                                    <IconPlayerPlay className="size-4" />
                                  )}
                                  {isActive
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
                    );
                  })}
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

export default SessionsPage;
