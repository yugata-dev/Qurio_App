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

        // Fetching data soal yang sudah dipublish
        const fetchDataCurrentPoll = async () => {
            try {
                const responseCurrentData = await fetchCurrentPoll(sessionId)
                setPoll(responseCurrentData)
            } catch {
                setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.")
            }
        }

        void fetchDataCurrentPoll()
        // =============================
        // 1. BUAT KONEKSI SOCKET
        // =============================

        const socket = io(SOCKET_URL)

        socketRef.current = socket

        console.log("Mencoba connect ke Socket.IO...")

        // =============================
        // 2. SAAT CONNECT BERHASIL
        // =============================

        socket.on("connect", () => {

            console.log("Socket terhubung:", socket.id)

            // =============================
            // 3. JOIN ROOM SESSION
            // =============================

            socket.emit("join_session", sessionId)

            console.log("Join session:", sessionId)
        })

        // =============================
        // 4. MENDENGARKAN POLL BARU
        // =============================

        socket.on("poll_created", (newPoll: Poll) => {

            console.log("Poll baru diterima:", newPoll)

            setPoll(newPoll)
        })

        // =============================
        // 5. MENDENGARKAN POLL DIUPDATE
        // =============================

        socket.on("poll_updated", (data) => {

            console.log("Poll diupdate:", data)

            setPoll((currentPoll) => {

                if (!currentPoll) return currentPoll

                if (currentPoll.id !== data.pollId) {
                    return currentPoll
                }

                return {
                    ...currentPoll,
                    status: data.status
                }
            })
        })

        // =============================
        // 6. SESSION BERAKHIR
        // =============================

        socket.on("session_ended", (session) => {

            console.log("Session berakhir:", session)

            setPoll(null)
        })

        // =============================
        // 7. CLEANUP
        // =============================

        return () => {

            console.log("Keluar dari session:", sessionId)

            socket.emit("leave_session", sessionId)

            socket.off("connect")
            socket.off("poll_created")
            socket.off("poll_updated")
            socket.off("session_ended")

            socket.disconnect()
        }

    }, [sessionId])


    return (
        <div className="p-6">

            <h1 className="text-xl font-bold mb-4">
                Session: {sessionId}
            </h1>

            {!poll && (
                <p>
                    Menunggu soal dari guru...
                </p>
            )}

            {poll && (
                <div className="border rounded-xl p-5">

                    <p className="text-sm text-gray-500">
                        {poll.type}
                    </p>

                    <h2 className="text-xl font-bold mt-2">
                        {poll.question}
                    </h2>

                    {poll.options?.length > 0 && (
                        <div className="mt-4 space-y-2">

                            {poll.options.map((option) => (
                                <div
                                    key={option.id}
                                    className="border rounded-lg p-3"
                                >
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