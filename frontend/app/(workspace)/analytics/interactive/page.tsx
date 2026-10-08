"use client";

// Halaman ini berjalan di client karena mengambil data sesi setelah komponen dirender.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionList, type SessionListItem } from "@/lib/api";

const summaryCardClass =
  "rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none";

// Komponen ini hanya mengatur tampilan daftar; data sesi tetap dikelola oleh halaman utama.
function SessionListContent({
  isLoading,
  sessions,
}: {
  isLoading: boolean;
  sessions: SessionListItem[];
}) {
  // Selama request berlangsung, pertahankan ruang daftar dengan skeleton loader.
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Setelah request selesai, beri arahan jika belum ada sesi yang sesuai.
  if (sessions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          Belum ada sesi interaktif
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Buat sesi pertama dengan mode Interaktif untuk memulai.
        </p>
      </div>
    );
  }

  // Setiap sesi diarahkan ke halaman detail berdasarkan identifier-nya.
  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => (
        <li key={session.id}>
          {/* Ringkasan menampilkan judul, jumlah peserta, dan status sesi. */}
          <Link
            href={`/dashboard/session/${session.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {session.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {session.participant_count} peserta ·{" "}
                {session.status === "active" ? "Aktif" : "Selesai"}
              </p>
            </div>
            {/* Variant badge mengikuti status aktif atau selesai. */}
            <Badge
              variant={session.status === "active" ? "default" : "secondary"}
              className="shrink-0"
            >
              {session.status === "active" ? "Aktif" : "Selesai"}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function InteractiveAnalyticsPage() {
  // State ini menyimpan hasil request, status loading, dan pesan error untuk UI.
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Penanda ini mencegah pembaruan state setelah halaman dilepas.
    let isMounted = true;

    // Ambil semua sesi, lalu tampilkan hanya sesi dengan mode interactive.
    getSessionList()
      .then((list) => {
        if (isMounted) {
          setSessions(list.filter((session) => session.mode === "interactive"));
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          // Gunakan pesan dari Error bila tersedia, dengan fallback yang ramah pengguna.
          setErrorMessage(
            error instanceof Error ? error.message : "Sesi gagal dimuat.",
          );
        }
      })
      .finally(() => {
        // Loading selesai baik request berhasil maupun gagal.
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Nilai kartu ringkasan dihitung dari sesi interaktif yang sudah difilter.
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce(
    // Nilai null/undefined dianggap sebagai nol agar perhitungan tetap aman.
    (sum, session) => sum + (session.participant_count ?? 0),
    0,
  );
  // Hindari pembagian dengan nol ketika belum ada sesi.
  const averageParticipants =
    totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0;

  // Struktur ini dipakai bersama untuk merender tiga kartu metrik utama.
  const metrics = [
    {
      label: "Total Sesi Interaktif",
      value: totalSessions,
      detail: "Sesi tanpa penilaian",
    },
    {
      label: "Total Partisipasi",
      value: totalParticipants,
      detail: "Total kehadiran siswa di seluruh sesi",
    },
    {
      label: "Rata-rata Peserta",
      value: averageParticipants,
      detail: "Siswa per sesi",
    },
  ];

  return (
    <div>
      <div className="mb-4">
        {/* Judul dan deskripsi menjelaskan cakupan data pada halaman ini. */}
        <h2 className="text-lg font-semibold text-foreground">
          Engagement Interaktif
        </h2>
        <p className="text-sm text-muted-foreground">
          Data dari sesi mode Interaktif: wordcloud, Q&amp;A, dan polling.
        </p>
      </div>

      {/* Error ditampilkan di bagian atas agar mudah terlihat pengguna. */}
      {errorMessage && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tiga kartu pertama berisi metrik yang dihitung dari daftar sesi. */}
        {metrics.map((metric) => (
          <Card key={metric.label} className={summaryCardClass}>
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {/* Angka ditunda sampai request selesai agar tidak menampilkan data sementara. */}
              {isLoading ? (
                <Skeleton className="h-8 w-28 rounded-lg" />
              ) : (
                <p className="text-[28px] font-bold tracking-tight text-foreground">
                  {metric.value}
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Kartu aktivitas disiapkan untuk data wordcloud, Q&A, dan polling. */}
        <Card className={summaryCardClass}>
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-[13px] font-medium text-muted-foreground">
              Aktivitas Digunakan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <p className="text-[28px] font-bold tracking-tight text-foreground">
              —
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Segera hadir (wordcloud, Q&amp;A, polling)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={`mt-6 ${summaryCardClass}`}>
        {/* Bagian ini menampilkan seluruh sesi interaktif yang pernah dibuat. */}
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            Daftar Sesi Interaktif
          </CardTitle>
          <CardDescription>
            Semua sesi mode interaktif yang pernah dibuat
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          <SessionListContent isLoading={isLoading} sessions={sessions} />
        </CardContent>
      </Card>
    </div>
  );
}
