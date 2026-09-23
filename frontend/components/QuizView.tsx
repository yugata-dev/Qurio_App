'use client'

import { io, Socket } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { fetchCurrentPoll, fetchResponsePoll, getDataSession } from "@/lib/api"
import { useForm } from "react-hook-form"
import { SessionData } from "@/app/dashboard/session/[id]/page"

interface QuizViewProps { sessionId: string }
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

// helper biar rapi
const getSubmittedKey = (pollId: string) => `submitted-${pollId}`

export default function QuizView({ sessionId }: QuizViewProps) {
    const { register, reset, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()
    const [poll, setPoll] = useState<Poll | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [session, setSession] = useState<SessionData | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const fetchRequestRef = useRef(0)

    useEffect(() => {
        if (!sessionId) return
        if (!socketRef.current) {
            socketRef.current = io(SOCKET_URL, { autoConnect: false })
        }
        const socket = socketRef.current

        const fetchPoll = async () => {
            const reqId = ++fetchRequestRef.current
            try {
                const data = await fetchCurrentPoll(sessionId)
                if (reqId !== fetchRequestRef.current) return

                if (data && data.status === "published") {
                    setPoll(data)
                    // CEK DISINI: udah pernah submit poll ini belum?
                    const alreadySubmitted = localStorage.getItem(getSubmittedKey(data.id)) === "true"
                    setSubmitted(alreadySubmitted)
                    if (!alreadySubmitted) {
                        setSelected(null)
                        reset({ answerStudent: "" })
                    }
                } else {
                    setPoll(null)
                    setSubmitted(false)
                }
            } catch {
                if (reqId !== fetchRequestRef.current) return
                setPoll(null)
            }
        }

        const fetchSessionData = async () => {
            try {
                const sessionResponse = await getDataSession(sessionId, null)
                setSession(sessionResponse.data)
            } catch {
                setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.")
            }
        }

        void fetchSessionData()

        const handleNewPoll = (newPoll: Poll) => {
            // soal baru dari guru, cek apakah soal baru ini udah pernah dijawab (harusnya belum)
            const alreadySubmitted = localStorage.getItem(getSubmittedKey(newPoll.id)) === "true"
            setPoll(newPoll.status === "published" ? newPoll : null)
            setSubmitted(alreadySubmitted)
            if (!alreadySubmitted) {
                setSelected(null)
                reset({ answerStudent: "" })
            }
        }

        const handleStatusChange = (data: { status: string }) => {
            if (data.status === "published") {
                fetchPoll()
                return
            }
            if (data.status === "closed" || data.status === "draft") {
                setSelected(null)
                setSubmitted(false)
                reset({ answerStudent: "" })
                setPoll(null)
            }
        }

        const onConnect = () => {
            socket.emit("join_session", sessionId)
            fetchPoll()
        }

        socket.on("connect", onConnect)
        socket.on("poll_created", handleNewPoll)
        socket.on("poll_updated", handleStatusChange)
        socket.on("all_polls_updated", handleStatusChange)
        socket.on("session_ended", () => setPoll(null))

        if (!socket.connected) socket.connect()
        else onConnect()

        return () => {
            socket.emit("leave_session", sessionId)
            socket.off("connect", onConnect)
            socket.off("poll_created", handleNewPoll)
            socket.off("poll_updated", handleStatusChange)
            socket.off("all_polls_updated", handleStatusChange)
            socket.off("session_ended")
            socket.disconnect()
        }
    }, [sessionId, reset])

    const onSubmitResponse = async (data: FormValues) => {
        try {
            if (!poll) throw new Error("Poll tidak ditemukan")
            const participantId = localStorage.getItem("participant_id")
            if (!participantId) throw new Error("Participant ID tidak ditemukan")
            if (poll.type === "quiz" && !selected) throw new Error("Pilih salah satu jawaban")

            await fetchResponsePoll(poll.id, participantId, data.answerStudent, poll.type === "quiz" ? selected : undefined)

            // SIMPAN STATUS SUBMIT PER POLL ID
            localStorage.setItem(getSubmittedKey(poll.id), "true")
            setSubmitted(true)

        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Gagal mengirim jawaban")
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#fafaf9] p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-xs tracking-widest uppercase text-black font-semibold">Live Session</p>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                {session?.title}
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-green-600 uppercase">Live</span>
                                </span>
                            </h1>
                        </div>
                    </div>
                    {errorMessage && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{errorMessage}</div>}
                    <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center shadow-sm">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                        <h3 className="font-bold text-zinc-800">Jawaban terkirim!</h3>
                        <p className="text-sm text-zinc-500 mt-1">Jawaban kamu sudah diterima. Tetap di sini menunggu soal selanjutnya.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fafaf9] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs tracking-widest uppercase text-black font-semibold">Live Session</p>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            {session?.title}
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-green-600 uppercase">Live</span>
                            </span>
                        </h1>
                    </div>
                </div>
                {errorMessage && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{errorMessage}</div>}
                {!poll && !errorMessage && (
                    <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center shadow-sm">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">👨🏫</div>
                        <h3 className="font-bold text-zinc-800">Menunggu soal dari guru...</h3>
                        <p className="text-sm text-zinc-500 mt-1">Tetap di halaman ini, soal akan muncul otomatis</p>
                    </div>
                )}
                {poll && (
                    <div className="bg-white rounded-2xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="p-6 md:p-8">
                            <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black tracking-widest uppercase">{poll.type}</span>
                            <h2 className="text-xl md:text-2xl font-bold leading-tight mt-4 text-zinc-900">{poll.question}</h2>
                        </div>
                        <div className="px-6 md:px-8 pb-8">
                            <form onSubmit={handleSubmit(onSubmitResponse)} className="space-y-3">
                                {poll.type !== "quiz" ? (
                                    <div>
                                        <textarea {...register("answerStudent", { required: "Jawaban wajib diisi" })} placeholder="Tulis jawabanmu disini..." className="mt-2 w-full bg-zinc-50 border-2 border-zinc-100 focus:border-zinc-900 focus:bg-white rounded-2xl h-36 text-sm outline-none py-4 px-4 resize-none transition-all" />
                                        {errors.answerStudent && <p className="text-xs text-red-500 mt-1">{errors.answerStudent.message}</p>}
                                    </div>
                                ) : (
                                    <>
                                        <input type="hidden" {...register("answerStudent", { required: "Pilih salah satu jawaban" })} />
                                        <div className="space-y-3">
                                            {poll.options?.sort((a, b) => a.option_order - b.option_order).map((opt) => {
                                                const char = String.fromCharCode(65 + opt.option_order - 1)
                                                const isActive = selected === opt.id
                                                return (
                                                    <button key={opt.id} type="button" onClick={() => { setSelected(opt.id); setValue("answerStudent", opt.option_text, { shouldDirty: true, shouldValidate: true }) }} className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-zinc-50 hover:border-zinc-300 text-zinc-700"}`}>
                                                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm ${isActive ? "bg-white text-zinc-900" : "bg-white border border-zinc-200"}`}>{char}</div>
                                                        <span className="text-sm font-medium">{opt.option_text}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {errors.answerStudent && <p className="text-xs text-red-500">{errors.answerStudent.message}</p>}
                                    </>
                                )}
                                <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-zinc-900 text-white text-sm font-bold rounded-2xl p-4 hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all">
                                    {isSubmitting ? "Mengirim..." : "Kirim Jawaban 🚀"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}