'use client'

import { io } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { IconCircleCheck, IconCircleCheckFilled, IconClock, IconSchool } from "@tabler/icons-react"
import { toast } from "@/components/ui/toast"
import {
    fetchCurrentPoll,
    fetchQuestionPoll,
    fetchResponsePoll,
    fetchWordcloudPoll,
    getPublicSession,
    type PublicSession,
} from "@/lib/api"

interface QuizViewProps {
    sessionId: string
    // dipanggil kalau server menolak participant_id (mis. sisa dari sesi lain)
    onInvalidParticipant?: () => void
}
interface PollOption { id: string; poll_id: string; option_text: string; is_correct?: boolean; option_order: number }
export interface Poll {
    id: string
    session_id: string
    type: string
    question: string
    status: string
    created_at: string
    published_at: string | null
    closed_at: string | null
    options: PollOption[]
}

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "")
type FormValues = { answerStudent: string }

const getSubmittedKey = (pollId: string) => `submitted-${pollId}`

// localStorage bisa melempar error (Safari private mode, storage penuh) -> bungkus
const readSubmitted = (pollId: string) => {
    try { return localStorage.getItem(getSubmittedKey(pollId)) === "true" } catch { return false }
}
const writeSubmitted = (pollId: string) => {
    try { localStorage.setItem(getSubmittedKey(pollId), "true") } catch { /* abaikan */ }
}

function Header({ title }: { title?: string }) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <p className="text-xs tracking-widest uppercase text-black font-semibold">Live Session</p>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    {title}
                    <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-green-600 uppercase">Live</span>
                    </span>
                </h1>
            </div>
        </div>
    )
}

function Notice({ Icon, title, text, tone = "zinc" }: { Icon: typeof IconClock; title: string; text: string; tone?: "zinc" | "green" }) {
    const bubble = tone === "green" ? "bg-green-100 text-green-600" : "bg-zinc-100"
    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center shadow-sm">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${bubble}`}><Icon className="size-7" /></div>
            <h3 className="font-bold text-zinc-800">{title}</h3>
            <p className="text-sm text-zinc-500 mt-1">{text}</p>
        </div>
    )
}

export default function QuizView({ sessionId, onInvalidParticipant }: QuizViewProps) {
    const { register, reset, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()
    const [poll, setPoll] = useState<Poll | null>(null)
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [sessionEnded, setSessionEnded] = useState(false)
    const [sessionData, setSessionData] = useState<PublicSession | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const fetchRequestRef = useRef(0)
    const currentPollIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (!sessionId) return
        let cancelled = false

        // SATU pintu untuk mengubah soal yang tampil
        const applyPoll = (next: Poll | null) => {
            currentPollIdRef.current = next?.id ?? null
            setPoll(next)
            setSubmitError(null)
            const already = next ? readSubmitted(next.id) : false
            setIsSubmitted(already)
            if (!already) {
                setSelectedOptionId(null)
                reset({ answerStudent: "" })
            }
        }

        const fetchSession = async () => {
            try {
                const data = await getPublicSession(sessionId)
                if (!cancelled) setSessionData(data)
            } catch {
                if (!cancelled) setSessionData(null)
            }
        }

        // Sumber kebenaran = server (soal published terbaru).
        // Event socket hanya pemicu; request lama yang telat balik dibuang.
        const fetchPoll = async () => {
            const reqId = ++fetchRequestRef.current
            try {
                const data = await fetchCurrentPoll(sessionId)
                if (cancelled || reqId !== fetchRequestRef.current) return
                applyPoll(data && data.status === "published" ? data : null)
            } catch (error) {
                if (cancelled || reqId !== fetchRequestRef.current) return

                const status = (error as { status?: number }).status
                if (status === 404) {
                    applyPoll(null)
                }
                // Error jaringan/server lain mempertahankan tampilan terakhir.
            }
        }

        const socket = io(SOCKET_URL)
        void fetchSession()

        const onConnect = () => {
            socket.emit("join_session", sessionId)
            // dipanggil juga saat reconnect -> sinkron event yang terlewat
            void fetchPoll()
        }

        const onPollCreated = (created: Poll) => {
            if (created.status !== "published" || created.session_id !== sessionId) return
            fetchRequestRef.current++ // batalkan fetch lama yang masih terbang
            applyPoll(created)
        }

        // Payload: { pollId, status, poll }. Soal LAIN yang ditutup tidak boleh
        // mengosongkan soal yang sedang tampil.
        const onPollUpdated = (data: { pollId?: string; status?: string }) => {
            if (data.status === "published" || data.pollId === currentPollIdRef.current) void fetchPoll()
        }

        // Bulk update: tidak ada pollId -> tanya server lagi
        const onAllPollsUpdated = () => void fetchPoll()

        const onSessionUpdated = (s: { status: string }) => {
            if (s.status === "ended") {
                setSessionEnded(true)
                fetchRequestRef.current++
                applyPoll(null)
            } else {
                setSessionEnded(false)
                void fetchPoll()
            }
        }

        socket.on("connect", onConnect)
        socket.on("poll_created", onPollCreated)
        socket.on("poll_updated", onPollUpdated)
        socket.on("all_polls_updated", onAllPollsUpdated)
        socket.on("session_updated", onSessionUpdated)

        return () => {
            cancelled = true
            socket.emit("leave_session", sessionId)
            socket.removeAllListeners()
            socket.disconnect()
        }
    }, [sessionId, reset])

    // salinan dulu, jangan .sort() langsung ke state (React Compiler yang memoize)
    const sortedOptions = poll?.options ? [...poll.options].sort((a, b) => a.option_order - b.option_order) : []

    const onSubmitResponse = async (data: FormValues) => {
        if (!poll) return
        setSubmitError(null)
        try {
            const participantId = localStorage.getItem("participant_id")
            if (!participantId) throw new Error("Participant ID tidak ditemukan")

            if (poll.type === "quiz" || poll.type === "polling") {
                if (!selectedOptionId) throw new Error("Pilih salah satu jawaban")
                await fetchResponsePoll(poll.id, participantId, data.answerStudent, selectedOptionId)
            } else if (poll.type === "qa") {
                if (!data.answerStudent?.trim()) throw new Error("Jawaban wajib diisi")
                await fetchQuestionPoll(poll.id, participantId, data.answerStudent.trim())
            } else if (poll.type === "wordcloud") {
                if (!data.answerStudent?.trim()) throw new Error("Kata wajib diisi")
                await fetchWordcloudPoll(poll.id, participantId, data.answerStudent.trim())
            }

            writeSubmitted(poll.id)
            setIsSubmitted(true)
            toast.add({
                title: "Jawaban terkirim",
                description: "Jawabanmu sudah tercatat. Tunggu soal berikutnya dari guru.",
                type: "success",
            })
        } catch (err) {
            const status = (err as { status?: number }).status
            if (status === 409) { // server bilang sudah pernah menjawab (mis. storage terhapus)
                writeSubmitted(poll.id)
                setIsSubmitted(true)
                toast.add({
                    title: "Jawaban terkirim",
                    description: "Jawabanmu sudah tercatat. Tunggu soal berikutnya dari guru.",
                    type: "success",
                })
                return
            }
            if (status === 403) { // participant_id bukan milik sesi ini
                try { localStorage.removeItem("participant_id"); localStorage.removeItem("participant") } catch { /* abaikan */ }
                onInvalidParticipant?.()
                return
            }
            setSubmitError(err instanceof Error ? err.message : "Gagal mengirim jawaban")
        }
    }

    const isChoice = poll?.type === "quiz" || poll?.type === "polling"

    return (
        <div className="min-h-screen bg-[#fafaf9] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Header title={sessionData?.title ?? "Sesi langsung"} />

                {submitError && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{submitError}</div>}

                {sessionEnded ? (
                    <Notice Icon={IconClock} title="Sesi telah berakhir" text="Terima kasih sudah berpartisipasi!" />
                ) : !poll ? (
                    <Notice Icon={IconSchool} title="Menunggu soal dari guru..." text="Tetap di halaman ini, soal akan muncul otomatis" />
                ) : isSubmitted ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                            <IconCircleCheck className="size-8 text-emerald-600" />
                        </div>
                        <p className="text-xl font-semibold text-foreground">Jawaban terkirim!</p>
                        <p className="text-sm text-muted-foreground">Jawabanmu sudah tercatat. Silakan tunggu soal berikutnya dari guru; soal baru akan muncul otomatis.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="p-6 md:p-8">
                            <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black tracking-widest uppercase">{poll.type}</span>
                            <h2 className="text-xl md:text-2xl font-bold leading-tight mt-4 text-zinc-900">{poll.question}</h2>
                        </div>
                        <div className="px-6 md:px-8 pb-8">
                            <form onSubmit={handleSubmit(onSubmitResponse)} className="space-y-3">
                                {!isChoice ? (
                                    <div>
                                        <textarea {...register("answerStudent", { required: "Jawaban wajib diisi" })} placeholder="Tulis jawabanmu disini..." className="mt-2 w-full bg-zinc-50 border-2 border-zinc-100 focus:border-zinc-900 focus:bg-white rounded-2xl h-36 text-sm outline-none py-4 px-4 resize-none transition-all" />
                                        {errors.answerStudent && <p className="text-xs text-red-500 mt-1">{errors.answerStudent.message}</p>}
                                    </div>
                                ) : (
                                    <>
                                        <input type="hidden" {...register("answerStudent", { required: "Pilih salah satu jawaban" })} />
                                        <div className="space-y-3">
                                            {sortedOptions.map((opt, i) => {
                                                const char = String.fromCharCode(65 + i)
                                                const isActive = selectedOptionId === opt.id
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedOptionId(opt.id)
                                                            setValue("answerStudent", opt.option_text, { shouldDirty: true, shouldValidate: true })
                                                        }}
                                                        className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30 text-zinc-700"}`}
                                                    >
                                                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{char}</div>
                                                        <span className={`flex-1 text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{opt.option_text}</span>
                                                        {isActive && <IconCircleCheckFilled className="size-5 text-primary" />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {errors.answerStudent && <p className="text-xs text-red-500">{errors.answerStudent.message}</p>}
                                    </>
                                )}
                                <button type="submit" disabled={!selectedOptionId || isSubmitting} className="w-full mt-6 bg-zinc-900 text-white text-sm font-bold rounded-2xl p-4 hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all">
                                    {isSubmitting ? "Mengirim..." : "Kirim Jawaban"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
