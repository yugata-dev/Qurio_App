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
} from "@/lib/api";

export interface SessionData {
  id: string;
  title: string;
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

type PollStats = { correct: number; wrong: number };
type StatsMap = Record<string, PollStats>;

// Payload yang IDEALNYA dikirim backend saat ada jawaban baru
type ResponseCreatedPayload = { poll_id?: string; is_correct?: boolean };

const FLUSH_DELAY_MS = 500; // gabungkan banyak event jadi 1 batch fetch
const FALLBACK_POLL_MS = 10_000; // polling HANYA saat socket terputus

const EMPTY_STATS: PollStats = { correct: 0, wrong: 0 };

/* ------------------------------------------------------------------ */
/* Card per poll: di-memo supaya hanya card yang berubah yang render   */
/* ------------------------------------------------------------------ */
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
  const total = stats.correct + stats.wrong;

  // Jangan mutasi props/state dengan .sort() langsung
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
              #{index + 1} •{" "}
              {poll.type === "qa" ? "TANYA JAWAB" : poll.type.toUpperCase()}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                poll.status === "published"
                  ? "bg-green-100 text-green-700"
                  : poll.status === "closed"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {poll.status}
            </span>

            {poll.type === "quiz" && total > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  Benar: {stats.correct}
                </span>
                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                  Salah: {stats.wrong}
                </span>
              </div>
            )}
          </div>

          <p className="font-medium text-gray-900">{poll.question}</p>

          {poll.type === "quiz" && sortedOptions.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {sortedOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`text-sm px-3 py-2 rounded-lg border ${
                    opt.is_correct
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-gray-50 border-gray-100 text-gray-700"
                  }`}
                >
                  {opt.option_text} {opt.is_correct && " ✔"}
                </div>
              ))}
            </div>
          )}

          {poll.type === "quiz" && total === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Belum ada jawaban masuk
            </p>
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
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
    const quizIds = new Set<string>();
    const dirty = new Set<string>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;

    const socketUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"
    ).replace(/\/api\/?$/, "");
    const socket = io(socketUrl, { withCredentials: true });

    // Ambil statistik HANYA untuk poll yang diminta (bukan semua poll)
    const fetchStats = async (ids: string[]) => {
      if (ids.length === 0) return;
      const results = await Promise.allSettled(
        ids.map((id) => fetchResponseGetPoll(id)),
      );
      if (cancelled) return;

      setStats((prev) => {
        const next = { ...prev };
        results.forEach((res, i) => {
          if (res.status !== "fulfilled") return; // 1 gagal tidak merusak yang lain
          const item = res.value.data.find((a) => a.poll_id === ids[i]);
          next[ids[i]] = {
            correct: item?.correct_count ?? 0,
            wrong: item?.incorrect_count ?? 0,
          };
        });
        return next;
      });
    };

    // Debounce: 50 siswa menjawab bersamaan => 1 batch, bukan 50 fetch
    const scheduleFlush = (pollId?: string) => {
      if (pollId) dirty.add(pollId);
      else quizIds.forEach((id) => dirty.add(id));
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        const ids = [...dirty];
        dirty.clear();
        void fetchStats(ids);
      }, FLUSH_DELAY_MS);
    };

    const startFallback = () => {
      if (!fallbackTimer)
        fallbackTimer = setInterval(() => scheduleFlush(), FALLBACK_POLL_MS);
    };
    const stopFallback = () => {
      if (fallbackTimer) clearInterval(fallbackTimer);
      fallbackTimer = null;
    };

    // Load awal: session & polls paralel, statistik hanya untuk quiz, cukup sekali
    const loadInitial = async () => {
      const [sessionRes, pollRes] = await Promise.allSettled([
        getDataSession(sessionId, null),
        getAllDataPolls(sessionId, null),
      ]);
      if (cancelled) return;

      if (sessionRes.status === "fulfilled") setSession(sessionRes.value.data);
      else setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.");

      if (pollRes.status === "fulfilled") {
        const loaded: Poll[] = Array.isArray(pollRes.value)
          ? pollRes.value
          : [];
        setPolls(loaded);
        loaded
          .filter((p) => p.type === "quiz")
          .forEach((p) => quizIds.add(p.id));
        void fetchStats([...quizIds]);
      } else {
        setErrorMessage("Gagal mengambil data poll");
      }
    };

    void loadInitial();

    // Join di event "connect" agar otomatis re-join setelah reconnect
    socket.on("connect", () => {
      socket.emit("join_session", sessionId);
      if (user?.id) socket.emit("join_teacher", user.id);
      stopFallback();
      scheduleFlush(); // sinkron ulang event yang mungkin terlewat saat putus
    });
    socket.on("disconnect", startFallback);
    socket.on("connect_error", startFallback);

    socket.on("response_created", (payload?: ResponseCreatedPayload) => {
      const pollId = payload?.poll_id;
      if (pollId && !quizIds.has(pollId)) return; // qa/wordcloud tidak butuh statistik

      // Kasus ideal: backend kirim poll_id + is_correct => 0 request
      if (pollId && typeof payload?.is_correct === "boolean") {
        const isCorrect = payload.is_correct;
        setStats((prev) => {
          const cur = prev[pollId] ?? EMPTY_STATS;
          return {
            ...prev,
            [pollId]: {
              correct: cur.correct + (isCorrect ? 1 : 0),
              wrong: cur.wrong + (isCorrect ? 0 : 1),
            },
          };
        });
        return;
      }

      // Fallback: refetch hanya poll yang terkena, di-debounce
      scheduleFlush(pollId);
    });

    return () => {
      cancelled = true;
      if (flushTimer) clearTimeout(flushTimer);
      stopFallback();
      socket.emit("leave_session", sessionId);
      if (user?.id) socket.emit("leave_teacher", user.id);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [sessionId, isAuthenticated, user?.id]);

  // Handler stabil (useCallback) agar React.memo pada PollCard efektif
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
      const updatedSession = await updateStatusSession(
        sessionId,
        statusTarget,
        null,
      );
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
        {/* Header Sesi */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mt-1">
                Title: {session?.title} • Kode:{" "}
                <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">
                  {session?.access_code}
                </span>
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                session?.status === "active"
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
              onClick={() =>
                router.push(`/dashboard/createpolls/${session?.id}`)
              }
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ml-auto"
            >
              + Buat Soal
            </button>
          </div>
        </div>

        {/* Alert */}
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
