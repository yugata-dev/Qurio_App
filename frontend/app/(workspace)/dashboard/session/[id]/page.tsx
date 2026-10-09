"use client";

import {
  IconChartBar,
  IconCheck,
  IconMessages,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import {
  fetchResponseGetPoll,
  getAllDataPolls,
  getDataSession,
  updateSinglePolls,
  updateStatusSession,
  type PollStats,
  type PollingDistributionItem,
} from "@/lib/api";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SessionData {
  id: string;
  title: string;
  mode: "interactive" | "quiz";
  access_code: string | number;
  type: "quiz" | "polling" | "qa" | "wordcloud";
  status: "active" | "ended";
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

export interface Poll {
  id: string;
  session_id: string;
  type: string;
  question: string;
  status: string;
  created_at: string;
  published_at: string | null;
  closed_at: string | null;
  options: PollOption[];
}

type StatsMap = Record<string, PollStats>;

type ResponseCreatedPayload = { poll_id?: string; is_correct?: boolean };

const EMPTY_STATS: PollStats = {
  pollId: "",
  pollType: "polling",
  totalVotes: 0,
  distribution: [],
};

function PollingResultCard({
  distribution,
  totalVotes,
}: {
  distribution: PollingDistributionItem[];
  totalVotes: number;
}) {
  if (!distribution || totalVotes === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Belum ada siswa yang menjawab. Vote akan muncul di sini secara real-time.
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Total {totalVotes} suara</span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {distribution.map((item) => (
        <div key={item.optionId} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {item.optionText}
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {item.votes} suara · {item.percentage}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PollCardProps {
  poll: Poll;
  index: number;
  stats: PollStats;
  onUpdate: (pollId: string, status: Poll["status"]) => void;
  onOpenDetail: (poll: Poll) => void;
}

const PollCard = memo(function PollCard({
  poll,
  index,
  stats,
  onUpdate,
  onOpenDetail,
}: PollCardProps) {
  const isQuizStats = stats.pollType === "quiz";
  const isPollingStats = stats.pollType === "polling";

  const sortedOptions = useMemo(
    () =>
      poll.options
        ? [...poll.options].sort((a, b) => a.option_order - b.option_order)
        : [],
    [poll.options],
  );

  return (
    <Card className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              #{index + 1} • {poll.type === "qa" ? "TANYA JAWAB" : poll.type.toUpperCase()}
            </p>
            <Badge
              variant="outline"
              className={
                poll.status === "published"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : poll.status === "closed"
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }
            >
              {poll.status === "published"
                ? "Dipublikasikan"
                : poll.status === "closed"
                  ? "Ditutup"
                  : "Draf"}
            </Badge>

            {poll.type === "quiz" && isQuizStats && (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Benar: {stats.correct_count}
                </span>
                <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  Salah: {stats.incorrect_count}
                </span>
              </div>
            )}

            {poll.type === "polling" && isPollingStats && (
              <div className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary">
                {stats.totalVotes} suara
              </div>
            )}
          </div>

          <p className="text-sm font-semibold leading-6 text-foreground">
            {poll.question}
          </p>

          {(poll.type === "quiz" || poll.type === "polling") &&
            sortedOptions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {sortedOptions.map((opt, optionIndex) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    <span>{opt.option_text}</span>
                    {poll.type === "quiz" && opt.is_correct && (
                      <span className="ml-auto text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <IconCheck className="mr-1 inline size-3" />Benar
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

          {poll.type === "polling" && isPollingStats && (
            <PollingResultCard
              distribution={stats.distribution}
              totalVotes={stats.totalVotes}
            />
          )}

          {poll.type === "quiz" && isQuizStats && stats.total_count === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Belum ada jawaban masuk
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            type="button"
            onClick={() => onUpdate(poll.id, "published")}
            disabled={poll.status === "published"}
            size="sm"
          >
            Publish
          </Button>
          <Button
            type="button"
            onClick={() => onUpdate(poll.id, "closed")}
            disabled={poll.status === "closed"}
            variant="outline"
            size="sm"
          >
            Tutup
          </Button>
          {(poll.type === "qa" || poll.type === "wordcloud") && (
            <Button
              type="button"
              onClick={() => onOpenDetail(poll)}
              variant="secondary"
              size="sm"
              className="sm:ml-auto"
            >
              Lihat detail
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [stats, setStats] = useState<StatsMap>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const sessionId = params?.id as string;

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;

    let cancelled = false;
    const allPollIds = new Set<string>();
    const socketUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    ).replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { withCredentials: true });

    const fetchStats = async (ids: string[]) => {
      if (ids.length === 0) return;
      const results = await Promise.allSettled(ids.map((id) => fetchResponseGetPoll(id)));
      if (cancelled) return;

      setStats((prev) => {
        const next = { ...prev };
        results.forEach((res, idx) => {
          if (res.status !== "fulfilled") return;
          const stat = res.value.data;
          if (!stat) return;
          next[ids[idx]] = stat;
        });
        return next;
      });
    };

    const loadInitial = async () => {
      const [sessionRes, pollRes] = await Promise.allSettled([
        getDataSession(sessionId, null),
        getAllDataPolls(sessionId, null),
      ]);
      if (cancelled) return;

      if (sessionRes.status === "fulfilled") setSession(sessionRes.value.data);
      else setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.");

      if (pollRes.status === "fulfilled") {
        const loaded: Poll[] = Array.isArray(pollRes.value) ? pollRes.value : [];
        setPolls(loaded);
        loaded.forEach((poll) => allPollIds.add(poll.id));
        void fetchStats([...allPollIds]);
      } else {
        setErrorMessage("Gagal mengambil data poll");
      }
    };

    void loadInitial();

    socket.on("connect", () => {
      socket.emit("join_session", sessionId);
      if (user?.id) socket.emit("join_teacher", user.id);
    });

    socket.on("poll_vote_updated", (payload: {
      pollId?: string;
      pollType?: string;
      distribution?: PollingDistributionItem[];
      totalVotes?: number;
      correct_count?: number;
      incorrect_count?: number;
      total_count?: number;
    }) => {
      if (!payload?.pollId) return;

      const pollId = String(payload.pollId);

      setStats((prev) => {
        const next: StatsMap = { ...prev };
        const stats: PollStats =
          payload.pollType === "polling"
            ? {
              pollId,
              pollType: "polling",
              totalVotes: payload.totalVotes ?? 0,
              distribution: payload.distribution ?? [],
            }
            : {
              pollId,
              pollType: "quiz",
              correct_count: payload.correct_count ?? 0,
              incorrect_count: payload.incorrect_count ?? 0,
              total_count: payload.total_count ?? 0,
            };

        next[pollId] = stats;
        return next;
      });
    });

    socket.on("response_created", (payload?: ResponseCreatedPayload) => {
      const pollId = payload?.poll_id;
      if (!pollId) return;

      if (typeof payload.is_correct === "boolean") {
        setStats((prev) => {
          const current = prev[pollId];
          if (current?.pollType !== "quiz") return prev;

          return {
            ...prev,
            [pollId]: {
              ...current,
              correct_count: current.correct_count + (payload.is_correct ? 1 : 0),
              incorrect_count: current.incorrect_count + (payload.is_correct ? 0 : 1),
              total_count: current.total_count + 1,
            },
          };
        });
      }
    });

    return () => {
      cancelled = true;
      socket.emit("leave_session", sessionId);
      if (user?.id) socket.emit("leave_teacher", user.id);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [sessionId, isAuthenticated, user?.id]);

  const onUpdateSingle = useCallback(
    async (pollId: string, statusTarget: Poll["status"]) => {
      if (!isAuthenticated) {
        setErrorMessage("Token tidak sesuai atau kedaluarsa..");
        return;
      }
      try {
        const updated = await updateSinglePolls(
          pollId,
          statusTarget === "closed" ? "closed" : "published",
          null,
        );
        setPolls((prev) =>
          prev
            ? prev.map((p) =>
              p.id === updated.id
                ? { ...updated, options: updated.options || p.options }
                : p,
            )
            : null,
        );
        setSuccessMessage(
          `Poll berhasil di-${statusTarget === "closed" ? "tutup" : "publish"}.`,
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Gagal mengupdate status.",
        );
      }
    },
    [isAuthenticated],
  );

  const onOpenDetail = useCallback(
    (poll: Poll) => {
      router.push(
        `/dashboard/session/${sessionId}/poll/${poll.id}/${poll.type === "qa" ? "qa" : "wordcloud"}`,
      );
    },
    [router, sessionId],
  );

  const toggleSessionStatus = async (statusTarget: SessionData["status"]) => {
    if (!isAuthenticated)
      return setErrorMessage("Sesi login tidak sesuai atau sudah kedaluwarsa.");
    try {
      const updatedSession = await updateStatusSession(sessionId, statusTarget, null);
      setSession(updatedSession);
      setErrorMessage(null);
      setSuccessMessage(
        statusTarget === "ended"
          ? "Sesi berhasil diakhiri."
          : "Sesi berhasil diaktifkan.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengubah status sesi.",
      );
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      <div className="space-y-6">
        <header>
          <Link href="/sessions" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            ← Semua sesi
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
                {session?.title ?? "Detail sesi"}
                {session && (
                  <Badge
                    variant="outline"
                    className="ml-2 align-middle"
                  >
                    {session.mode === "quiz" ? <><IconChartBar className="mr-1 inline size-3" />Sesi Quiz</> : <><IconMessages className="mr-1 inline size-3" />Sesi Interaktif</>}
                  </Badge>
                )}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Kode akses</span>
                <span className="rounded-md bg-muted px-2 py-1 font-mono font-semibold tracking-wider text-foreground">
                  {session?.access_code}
                </span>
                <CopyButton text={session?.access_code || ""} />
              </p>
            </div>
            {session && (
              <Badge variant="outline" className={session.status === "active" ? "w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "w-fit border-border bg-muted text-muted-foreground"}>
                <span className={`mr-1.5 size-1.5 rounded-full ${session.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
                {session.status === "ended" ? "Selesai" : "Aktif"}
              </Badge>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
              type="button"
              onClick={() => void toggleSessionStatus("active")}
              disabled={session?.status === "active"}
              variant="outline"
              size="sm"
                className="border-emerald-600 bg-transparent text-emerald-600 hover:border-emerald-600 hover:bg-transparent hover:text-emerald-700 dark:border-emerald-500 dark:text-emerald-400 dark:hover:border-emerald-500 dark:hover:bg-transparent dark:hover:text-emerald-300"
              >
                <IconPlayerPlay className="size-4" aria-hidden="true" />
                Aktifkan
              </Button>
              <Button
              type="button"
              onClick={() => void toggleSessionStatus("ended")}
              disabled={session?.status === "ended"}
              variant="outline"
              size="sm"
                className="border-red-600 bg-transparent text-red-600 hover:border-red-600 hover:bg-transparent hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-transparent dark:hover:text-red-300"
              >
                <IconPlayerStop className="size-4" aria-hidden="true" />
                Akhiri Sesi
              </Button>
            </div>
            <div className="flex sm:justify-end">
              <Button
              type="button"
              onClick={() => {
                if (session?.mode === "quiz") {
                  router.push(`/dashboard/session/${sessionId}/create-poll?type=quiz`);
                } else {
                  router.push(`/dashboard/session/${sessionId}/create-poll`);
                }
              }}
              size="sm"
                className="w-full sm:w-auto"
            >
              {session?.mode === "quiz" ? "+ Buat Soal Quiz" : "+ Buat Aktivitas"}
              </Button>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
            {successMessage}
          </div>
        )}

        <Card className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
          <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base font-semibold">Aktivitas sesi</CardTitle>
            <p className="text-xs text-muted-foreground">
              {polls ? `${polls.length} aktivitas` : "Memuat aktivitas..."}
            </p>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            {!polls || polls.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">Belum ada aktivitas di sesi ini</p>
                <p className="mt-1 text-xs text-muted-foreground">Buat aktivitas pertama untuk mulai melibatkan siswa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {polls.map((poll, index) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    index={index}
                    stats={stats[poll.id] ?? EMPTY_STATS}
                    onUpdate={onUpdateSingle}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default SessionPage;
