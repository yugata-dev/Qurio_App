'use client'

import { io, Socket } from "socket.io-client"
import { useEffect, useRef, useState } from "react"
import { fetchCurrentPoll } from "@/lib/api";

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

export default function QuizView({ sessionId }: QuizViewProps) {
    const [poll, setPoll] = useState<Poll | null>(null)
    const socketRef = useRef<Socket | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
            try {
                const responseCurrentData = await fetchCurrentPoll(sessionId)
                setPoll(responseCurrentData)
                setErrorMessage(null)
            } catch {
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

            if (data.status === "closed") {
                setPoll(null)
            }
        }

        const onAllPollsUpdated = (data: { status: string }) => {
            console.log("Semua poll diupdate secara realtime:", data)

            if (data.status === "published") {
                void fetchDataCurrentPoll()
                return
            }

            if (data.status === "closed") {
                setPoll(null)
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


    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4"> Session: {sessionId} </h1>
            {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

            {!poll && !errorMessage && (
                <p> Menunggu soal dari guru... </p>
            )}

            {poll && (
                <div className="border rounded-xl p-5">
                    <p className="text-sm text-gray-500"> {poll.type} </p>
                    <h2 className="text-xl font-bold mt-2"> {poll.question} </h2>
                    {poll.options?.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {poll.options.map((option) => (
                                <div key={option.id} className="border rounded-lg p-3" >
                                    {option.option_text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
