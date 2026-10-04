"use client";

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

export default function InteractiveAnalyticsPage() {
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        getSessionList()
            .then((list) => {
                if (isMounted) {
                    setSessions(list.filter((session) => session.mode === "interactive"));
                }
            })
            .catch((error: unknown) => {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error ? error.message : "Sesi gagal dimuat.",
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

    const totalSessions = sessions.length;
    const totalParticipants = sessions.reduce(
        (sum, session) => sum + (session.participant_count ?? 0),
        0,
    );
    const averageParticipants =
        totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0;

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
                <h2 className="text-lg font-semibold text-foreground">
                    Engagement Interaktif
                </h2>
                <p className="text-sm text-muted-foreground">
                    Data dari sesi mode Interaktif: wordcloud, Q&amp;A, dan polling.
                </p>
            </div>

            {errorMessage && (
                <p className="mb-4 text-sm text-destructive" role="alert">
                    {errorMessage}
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.label} className={summaryCardClass}>
                        <CardHeader className="p-5 pb-0">
                            <CardTitle className="text-[13px] font-medium text-muted-foreground">
                                {metric.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
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
                <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
                    <CardTitle className="text-base font-semibold text-foreground">
                        Daftar Sesi Interaktif
                    </CardTitle>
                    <CardDescription>
                        Semua sesi mode interaktif yang pernah dibuat
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map((row) => (
                                <Skeleton key={row} className="h-16 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-semibold text-foreground">
                                Belum ada sesi interaktif
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Buat sesi pertama dengan mode Interaktif untuk memulai.
                            </p>
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {sessions.map((session) => (
                                <li key={session.id}>
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
                                        <Badge
                                            variant={
                                                session.status === "active" ? "default" : "secondary"
                                            }
                                            className="shrink-0"
                                        >
                                            {session.status === "active" ? "Aktif" : "Selesai"}
                                        </Badge>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}