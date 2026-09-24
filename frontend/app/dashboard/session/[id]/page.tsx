"use client";

import { useAuth } from "@/context/AuthContext";
import {
  getAllDataPolls,
  getDataSession,
  updateSinglePolls,
  updateStatusSession,
} from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export interface SessionData {
  id: string;
  title: string;
  access_code: string | number;
  type: "quiz" | "qa" | "wordcloud";
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

function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const sessionId = params?.id as string;

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;
    const fetchSessionData = async () => {
      try {
        const sessionResponse = await getDataSession(sessionId, null);
        setSession(sessionResponse.data);
      } catch {
        setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.");
      }
    };
    const fetchPollData = async () => {
      try {
        const pollResponse = await getAllDataPolls(sessionId, null);
        setPolls(Array.isArray(pollResponse) ? pollResponse : []);
      } catch {
        setErrorMessage("Gagal mengambil data poll");
      }
    };
    void fetchPollData();
    void fetchSessionData();
  }, [sessionId, isAuthenticated]);

  const onUpdateSingle = async (
    pollId: string,
    statusTarget: Poll["status"],
  ) => {
    if (!isAuthenticated) {
      setErrorMessage("Token tidak sesuai atau kedaluarsa..");
      return;
    }
    try {
      const updateSingle = await updateSinglePolls(
        pollId,
        statusTarget === "closed" ? "closed" : "published",
        null,
      );
      setPolls((prev) =>
        prev
          ? prev.map((p) =>
              p.id === updateSingle.id
                ? {
                    ...updateSingle,
                    options: updateSingle.options || p.options,
                  }
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
  };

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
              <h1 className="text-xl font-bold text-foreground">
                {session?.title || `Sesi ${session?.id}`}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                ID: {session?.id} • Kode:{" "}
                <span className="rounded bg-muted px-2 py-0.5 font-mono font-semibold">
                  {session?.access_code}
                </span>
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${session?.status === "active" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
            >
              {session?.status === "ended" ? "Selesai" : "Aktif"}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void toggleSessionStatus("active")}
              disabled={session?.status === "active"}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Aktifkan
            </button>
            <button
              onClick={() => void toggleSessionStatus("ended")}
              disabled={session?.status === "ended"}
              className="rounded-lg bg-foreground px-4 py-2 text-sm text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Akhiri Sesi
            </button>
            <button
              onClick={() =>
                router.push(`/dashboard/createpolls/${session?.id}`)
              }
              className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              + Buat Soal
            </button>
          </div>
        </div>

        {/* Alert */}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            {successMessage}
          </div>
        )}

        {/* List Poll */}
        <div>
          <h2 className="mb-3 font-semibold text-foreground">
            Daftar Pertanyaan ({polls?.length || 0})
          </h2>

          {!polls || polls.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Belum ada pertanyaan di sesi ini.
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map((poll, index) => (
                <div
                  key={poll.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="mb-1 text-xs text-muted-foreground">
                        #{index + 1} • {poll.type.toUpperCase()} •{" "}
                        <span
                          className={
                            poll.status === "published"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : poll.status === "closed"
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }
                        >
                          {poll.status}
                        </span>
                      </p>
                      <p className="font-medium text-foreground">
                        {poll.question}
                      </p>

                      {poll.type === "quiz" && poll.options && (
                        <div className="mt-3 space-y-1.5">
                          {poll.options
                            .sort((a, b) => a.option_order - b.option_order)
                            .map((opt) => (
                              <div
                                key={opt.id}
                                className={`rounded-lg border px-3 py-2 text-sm ${opt.is_correct ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-border bg-muted/40 text-muted-foreground"}`}
                              >
                                {opt.option_text} {opt.is_correct && " ✔"}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => void onUpdateSingle(poll.id, "published")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={poll.status === "published"}
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => void onUpdateSingle(poll.id, "closed")}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-muted disabled:opacity-50"
                      disabled={poll.status === "closed"}
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionPage;
