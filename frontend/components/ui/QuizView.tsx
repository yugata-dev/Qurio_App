'use client'

import { io, Socket } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { fetchCurrentPoll, fetchResponsePoll, responseQuestions } from "@/lib/api";
import { useFieldArray, useForm } from "react-hook-form";

interface QuizViewProps {
    sessionId: string;
}

interface PollOption {
    id: string;
    poll_id: string;
    option_text: string;
    is_correct?: boolean;
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

const SOCKET_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "")

type FormValues = {
    answerStudent: string
}

export default function QuizView({ sessionId }: QuizViewProps) {
    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>()

    // reset selected tiap soal baru ganti

    const [poll, setPoll] = useState<Poll | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const fetchRequestRef = useRef(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [selected, setSelected] = useState<string | null>(null)

    useEffect(() => {
        setSelected(null)
        setValue("answerStudent", "")
    }, [poll?.id,])

    useEffect(() => {
        if (!sessionId) return

        // 1. Inisialisasi Socket (Cegah Duplikasi)
        if (!socketRef.current) {
            console.log("Mencoba connect ke Socket.IO...")
            socketRef.current = io(SOCKET_URL, {
                autoConnect: false // Kontrol manual koneksinya
            })
        }

        const socket = socketRef.current

        // Fungsi penarik data dipindahkan ke dalam scope agar bisa dipanggil tepat waktu
        const fetchDataCurrentPoll = async () => {
            const requestId = ++fetchRequestRef.current

            try {
                const responseCurrentData = await fetchCurrentPoll(sessionId)
                if (requestId !== fetchRequestRef.current) return
                setPoll(responseCurrentData)
                setErrorMessage(null)
            } catch {
                if (requestId !== fetchRequestRef.current) return
                setPoll(null)
                setErrorMessage(null)
            }
        }

        // 2. Definisi Handler Event
        const onConnect = () => {
            console.log("Socket terhubung:", socket.id)

            // UTAMA: Masuk ke room dulu agar siap menerima update realtime
            socket.emit("join_session", sessionId)
            console.log("Join session:", sessionId)

            // SETELAH masuk room, baru ambil data awal (State Sinkron)
            void fetchDataCurrentPoll()
        }

        const onPollCreated = (newPoll: Poll) => {
            console.log("Poll baru diterima secara realtime:", newPoll)
            setPoll(newPoll)
        }

        const onPollUpdated = (data: { pollId: string; status: string }) => {
            console.log("Poll diupdate secara realtime:", data)

            if (data.status === "published") {
                void fetchDataCurrentPoll()
                return
            }

            if (data.status === "closed" || data.status === "draft") {
                void fetchDataCurrentPoll()
            }
        }

        const onAllPollsUpdated = (data: { status: string }) => {
            console.log("Semua poll diupdate secara realtime:", data)

            if (data.status === "published") {
                void fetchDataCurrentPoll()
                return
            }

            if (data.status === "closed") {
                void fetchDataCurrentPoll()
            }
        }

        const onSessionEnded = () => {
            setPoll(null)
        }

        // 3. Pasang Listener
        socket.on("connect", onConnect)
        socket.on("poll_created", onPollCreated)
        socket.on("poll_updated", onPollUpdated)
        socket.on("all_polls_updated", onAllPollsUpdated)
        socket.on("session_ended", onSessionEnded)

        // 4. Jalankan Koneksi
        if (!socket.connected) {
            socket.connect()
        } else {
            // Jika socket ternyata sudah connect (karena re-render), langsung jalankan fungsinya
            onConnect()
        }

        // 5. Cleanup
        return () => {
            console.log("Meninggalkan session:", sessionId)
            socket.emit("leave_session", sessionId)

            socket.off("connect", onConnect)
            socket.off("poll_created", onPollCreated)
            socket.off("poll_updated", onPollUpdated)
            socket.off("all_polls_updated", onAllPollsUpdated)
            socket.off("session_ended", onSessionEnded)

            socket.disconnect()
        }
    }, [sessionId])

    const onSubmitResponse = async (responseData: FormValues) => {
        try {
            const localid = localStorage.getItem("participant_id")
            if (!localid) {
                throw new Error("Participant ID tidak ditemukan.")
            }

            if (!poll) {
                throw new Error("Poll tidak ditemukan.")
            }

            if (poll.type === "quiz" && !selected) {
                throw new Error("Pilih salah satu jawaban.")
            }

            await fetchResponsePoll(
                poll.id,
                localid,
                responseData.answerStudent,
                poll.type === "quiz" ? selected : undefined
            )

        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-[#fafaf9] p-4 md:p-8">
            <div className="max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs tracking-widest uppercase text-zinc-400 font-semibold">Live Session</p>
                        <h1 className="text-2xl font-black tracking-tight">
                            {sessionId}
                            <span className="ml-2 inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold text-green-600 uppercase">Live</span>
                            </span>
                        </h1>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex gap-3 text-sm">
                        <span className="text-lg">⚠</span>
                        <p className="font-medium">{errorMessage}</p>
                    </div>
                )}

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
                            <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black tracking-widest uppercase">
                                {poll.type}
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold leading-tight mt-4 text-zinc-900">
                                {poll.question}
                            </h2>
                        </div>

                        <div className="px-6 md:px-8 pb-8">
                            <form onSubmit={handleSubmit(onSubmitResponse)} className="space-y-3">

                                {poll.type !== "quiz" ? (
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Jawabanmu</label>
                                        <textarea
                                            {...register("answerStudent", { required: "Jawaban wajib diisi" })}
                                            placeholder="Tulis jawabanmu disini..."
                                            className="mt-2 w-full bg-zinc-50 border-2 border-zinc-100 focus:border-zinc-900 focus:bg-white rounded-2xl h-36 text-sm outline-none py-4 px-4 resize-none transition-all placeholder:text-zinc-400"
                                        />
                                        {errors.answerStudent && <p className="text-xs text-red-500 mt-1">{errors.answerStudent.message as string}</p>}
                                    </div>
                                ) : (
                                    <>
                                        {/* laci khusus quiz, cuma muncul kalau quiz */}
                                        <input type="hidden" {...register("answerStudent", { required: "Pilih salah satu jawaban" })} />
                                        <div className="space-y-3">
                                            {poll.options
                                                ?.sort((a, b) => a.option_order - b.option_order)
                                                .map((opt) => {
                                                    const char = String.fromCharCode(65 + opt.option_order - 1)
                                                    const isActive = selected === opt.id
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelected(opt.id)
                                                                setValue("answerStudent", opt.option_text, { shouldDirty: true, shouldValidate: true })
                                                            }}
                                                            className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 bg-zinc-50 hover:border-zinc-300 hover:bg-white text-zinc-700"
                                                                }`}
                                                        >
                                                            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-black text-sm transition-all ${isActive ? "bg-white text-zinc-900" : "bg-white border border-zinc-200"}`}>
                                                                {char}
                                                            </div>
                                                            <span className="text-sm font-medium">{opt.option_text}</span>
                                                        </button>
                                                    )
                                                })}
                                        </div>
                                        {errors.answerStudent && <p className="text-xs text-red-500">{errors.answerStudent.message as string}</p>}
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-6 bg-zinc-900 text-white text-sm font-bold rounded-2xl p-4 hover:bg-black active:scale-[0.98] disabled:opacity-50 shadow-lg transition-all"
                                >
                                    {isSubmitting ? "Sedang memproses..." : "Kirim Jawaban 🚀"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}