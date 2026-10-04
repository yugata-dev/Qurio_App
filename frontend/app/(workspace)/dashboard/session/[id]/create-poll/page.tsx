"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createPolls, getDataSession } from "@/lib/api";

type PollType = "quiz" | "polling" | "qa" | "wordcloud";

export default function CreatePollPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<any>(null);
    const [pollType, setPollType] = useState<string>(searchParams.get("type") || "");
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [correctIndex, setCorrectIndex] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        getDataSession(sessionId, null)
            .then((response) => {
                const sessionData = response.data;
                setSession(sessionData);

                if (sessionData?.mode === "quiz") {
                    setPollType("quiz");
                    return;
                }

                if (!searchParams.get("type")) {
                    setPollType("wordcloud");
                }
            })
            .catch(() => {
                setErrorMessage("Gagal memuat data sesi.");
            });
    }, [searchParams, sessionId]);

    const requiresOptions = pollType === "quiz" || pollType === "polling";

    const updateOption = (index: number, value: string) => {
        setOptions((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const addOption = () => {
        setOptions((prev) => [...prev, ""]);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) return;
        setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSubmit = async () => {
        setErrorMessage(null);

        if (!pollType) {
            setErrorMessage("Pilih tipe aktivitas terlebih dahulu.");
            return;
        }

        if (!question.trim()) {
            setErrorMessage("Judul soal wajib diisi.");
            return;
        }

        if (requiresOptions) {
            if (options.length < 2) {
                setErrorMessage("Minimal ada 2 opsi jawaban.");
                return;
            }

            const trimmedOptions = options.map((option) => option.trim());
            if (trimmedOptions.some((option) => !option)) {
                setErrorMessage("Semua opsi jawaban harus diisi.");
                return;
            }

            if (pollType === "quiz" && correctIndex === null) {
                setErrorMessage("Pilih jawaban benar untuk quiz.");
                return;
            }
        }

        try {
            setSubmitting(true);

            const payloadOptions = requiresOptions
                ? options.map((option, index) => ({
                    text: option.trim(),
                    is_correct: pollType === "quiz" && index === correctIndex,
                    option_order: index,
                }))
                : [];

            await createPolls(
                pollType,
                question.trim(),
                payloadOptions,
                sessionId,
                "",
                "published",
            );

            router.push(`/dashboard/session/${sessionId}`);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Gagal membuat aktivitas.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="mx-auto w-full max-w-[800px] p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold">
                    Buat {session?.mode === "quiz" ? "Soal Quiz" : "Aktivitas Baru"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {session?.mode === "quiz"
                        ? "Tambahkan soal pilihan ganda untuk sesi quiz ini."
                        : "Pilih tipe aktivitas dan isi detailnya."}
                </p>
            </header>

            {errorMessage && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tipe Aktivitas</label>
                    <select
                        value={pollType}
                        onChange={(event) => {
                            const nextType = event.target.value as PollType;
                            setPollType(nextType);
                            if (nextType !== "quiz") setCorrectIndex(null);
                        }}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        disabled={session?.mode === "quiz"}
                    >
                        {session?.mode === "quiz" ? (
                            <option value="quiz">Quiz</option>
                        ) : (
                            <>
                                <option value="">Pilih tipe</option>
                                <option value="polling">Polling</option>
                                <option value="wordcloud">Wordcloud</option>
                                <option value="qa">Tanya Jawab</option>
                            </>
                        )}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Judul soal</label>
                    <textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Tulis pertanyaan atau prompt aktivitas..."
                        className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>

                {requiresOptions && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Opsi Jawaban</label>
                            <button
                                type="button"
                                onClick={addOption}
                                className="rounded-md border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                                + Tambah opsi
                            </button>
                        </div>

                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={`${index}-${option}`} className="flex items-center gap-3">
                                    <input
                                        value={option}
                                        onChange={(event) => updateOption(index, event.target.value)}
                                        placeholder={`Opsi ${index + 1}`}
                                        className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                                    />

                                    {pollType === "quiz" && (
                                        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            Benar
                                            <input
                                                type="radio"
                                                name="correct-answer"
                                                checked={correctIndex === index}
                                                onChange={() => setCorrectIndex(index)}
                                            />
                                        </label>
                                    )}

                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/dashboard/session/${sessionId}`)}
                        className="rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Menyimpan..." : "Simpan Aktivitas"}
                    </button>
                </div>
            </div>
        </section>
    );
}
