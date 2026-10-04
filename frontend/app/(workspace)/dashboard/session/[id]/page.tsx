"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
    <div className="bg-white border rounded-xl p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-xs text-gray-500">
              #{index + 1} • {poll.type === "qa" ? "TANYA JAWAB" : poll.type.toUpperCase()}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${poll.status === "published"
                ? "bg-green-100 text-green-700"
                : poll.status === "closed"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
                }`}
            >
              {poll.status}
            </span>

            {poll.type === "quiz" && isQuizStats && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  Benar: {stats.correct_count}
                </span>
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                  Salah: {stats.incorrect_count}
                </span>
              </div>
            )}

            {poll.type === "polling" && isPollingStats && (
              <div className="ml-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {stats.totalVotes} suara
              </div>
            )}
          </div>

          <p className="font-medium text-gray-900">{poll.question}</p>

          {(poll.type === "quiz" || poll.type === "polling") &&
            sortedOptions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {sortedOptions.map((opt, optionIndex) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="font-mono text-xs text-gray-500">
                      {String.fromCharCode(65 + optionIndex)}.
                    </span>
                    <span>{opt.option_text}</span>
                    {poll.type === "quiz" && opt.is_correct && (
                      <span className="ml-auto text-xs font-semibold text-emerald-600">
                        ✓ Benar
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
            <p className="text-xs text-gray-400 mt-2">Belum ada jawaban masuk</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onUpdate(poll.id, "published")}
          disabled={poll.status === "published"}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          Publish
        </button>
        <button
          onClick={() => onUpdate(poll.id, "closed")}
          disabled={poll.status === "closed"}
          className="text-xs px-3 py-1.5 rounded-lg bg-white border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Tutup
        </button>
        {(poll.type === "qa" || poll.type === "wordcloud") && (
          <button
            onClick={() => onOpenDetail(poll)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black ml-auto"
          >
            Lihat detail
          </button>
        )}
      </div>
    </div>
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
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="mb-2 text-xl font-semibold">
                {session?.title}
                {session && (
                  <Badge
                    variant={session.mode === "quiz" ? "default" : "secondary"}
                    className="ml-2 align-middle"
                  >
                    {session.mode === "quiz" ? "📊 Sesi Quiz" : "💬 Sesi Interaktif"}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Kode:{" "}
                <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
                  {session?.access_code}
                </span>
                <CopyButton text={session?.access_code || ""} />
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${session?.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
                }`}
            >
              {session?.status === "ended" ? "Selesai" : "Aktif"}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void toggleSessionStatus("active")}
              disabled={session?.status === "active"}
              className="text-sm px-4 py-2 rounded-lg bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aktifkan
            </button>
            <button
              onClick={() => void toggleSessionStatus("ended")}
              disabled={session?.status === "ended"}
              className="text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Akhiri Sesi
            </button>
            <button
              onClick={() => {
                if (session?.mode === "quiz") {
                  router.push(`/dashboard/session/${sessionId}/create-poll?type=quiz`);
                } else {
                  router.push(`/dashboard/session/${sessionId}/create-poll`);
                }
              }}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ml-auto"
            >
              {session?.mode === "quiz" ? "+ Buat Soal Quiz" : "+ Buat Aktivitas"}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <h2 className="font-semibold text-gray-800 mb-3">
          Daftar Pertanyaan ({polls?.length || 0})
        </h2>

        {!polls || polls.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
            Belum ada pertanyaan di sesi ini.
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
      </div>
    </div>
  );
}

export default SessionPage;
