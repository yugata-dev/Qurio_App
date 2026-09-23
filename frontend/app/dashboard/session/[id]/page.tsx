"use client"

import { useAuth } from "@/context/AuthContext"
import { fetchResponseGetPoll, getAllDataPolls, getDataSession, responseAnswer, updateSinglePolls, updateStatusSession } from "@/lib/api"
import { io } from "socket.io-client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export interface SessionData {
  id: string
  title: string
  access_code: string | number
  type: "quiz" | "qa" | "wordcloud"
  status: "active" | "ended"
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

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

function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const { isAutheticated } = useAuth() // typo: harusnya isAuthenticated
  const [session, setSession] = useState<SessionData | null>(null)
  const [polls, setPolls] = useState<Poll[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resultAnswer, setResultAnswer] = useState<responseAnswer | null>(null)
  const sessionId = params?.id as string

  useEffect(() => {
    if (!isAutheticated || !sessionId) return;
    const socketUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001").replace(/\/api\/?$/, "")
    const socket = io(socketUrl, { withCredentials: true })

    const fetchSessionData = async () => {
      try {
        const sessionResponse = await getDataSession(sessionId, null)
        setSession(sessionResponse.data)
      } catch {
        setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.")
      }
    }

    const fetchAnswerStudent = async (pollList: Poll[]) => {
      try {
        const answerResponses = await Promise.all(
          pollList.map((poll) => fetchResponseGetPoll(poll.id)),
        )
        setResultAnswer({
          success: answerResponses.every((response) => response.success),
          data: answerResponses.flatMap((response) => response.data),
        })
      } catch (error) {
        console.error("terjadi error pengabilan data:", error)
      }
    }

    const fetchPollData = async () => {
      try {
        const pollResponse = await getAllDataPolls(sessionId, null)
        const loadedPolls = Array.isArray(pollResponse) ? pollResponse : []
        setPolls(loadedPolls)
        await fetchAnswerStudent(loadedPolls)
      } catch {
        setErrorMessage("Gagal mengambil data poll")
      }
    }

    void fetchPollData()
    void fetchSessionData()

    socket.emit("join_session", sessionId)
    socket.on("response_created", () => {
      void fetchPollData()
    })
    const refreshTimer = setInterval(() => {
      void fetchPollData()
    }, 3000)

    return () => {
      socket.emit("leave_session", sessionId)
      socket.disconnect()
      clearInterval(refreshTimer)
    }
  }, [sessionId, isAutheticated])

  const onUpdateSingle = async (pollId: string, statusTarget: Poll["status"]) => {
    if (!isAutheticated) {
      setErrorMessage("Token tidak sesuai atau kedaluarsa..")
      return
    }
    try {
      const updateSingle = await updateSinglePolls(pollId, statusTarget === "closed" ? "closed" : "published", null)
      setPolls((prev) => prev ? prev.map(p => p.id === updateSingle.id ? { ...updateSingle, options: updateSingle.options || p.options } : p) : null)
      setSuccessMessage(`Poll berhasil di-${statusTarget === 'closed' ? 'tutup' : 'publish'}.`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengupdate status.")
    }
  }

  const toggleSessionStatus = async (statusTarget: SessionData["status"]) => {
    if (!isAutheticated) return setErrorMessage("Sesi login tidak sesuai atau sudah kedaluwarsa.")
    try {
      const updatedSession = await updateStatusSession(sessionId, statusTarget, null)
      setSession(updatedSession)
      setErrorMessage(null)
      setSuccessMessage(statusTarget === "ended" ? "Sesi berhasil diakhiri." : "Sesi berhasil diaktifkan.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal mengubah status sesi.")
    }
  }

  const getPollStats = (pollId: string) => {
    const pollResult = resultAnswer?.data.find((answer: any) => answer.poll_id === pollId)
    return {
      correct: pollResult?.correct_count ?? 0,
      wrong: pollResult?.incorrect_count ?? 0,
      total: (pollResult?.correct_count ?? 0) + (pollResult?.incorrect_count ?? 0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Sesi */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mt-1">ID: {session?.id} • Kode: <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{session?.access_code}</span></p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${session?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {session?.status === "ended" ? "Selesai" : "Aktif"}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => void toggleSessionStatus("active")} disabled={session?.status === "active"} className="text-sm px-4 py-2 rounded-lg bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">Aktifkan</button>
            <button onClick={() => void toggleSessionStatus("ended")} disabled={session?.status === "ended"} className="text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">Akhiri Sesi</button>
            <button onClick={() => router.push(`/dashboard/createpolls/${session?.id}`)} className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ml-auto">+ Buat Soal</button>
          </div>
        </div>

        {/* Alert */}
        {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{errorMessage}</div>}
        {successMessage && <div className="bg-green-50 border-green-200 text-green-700 text-sm p-3 rounded-lg">{successMessage}</div>}

        {/* List Poll - Udah gabung sama statistik */}
        <h2 className="font-semibold text-gray-800 mb-3">Daftar Pertanyaan ({polls?.length || 0})</h2>

        {!polls || polls.length === 0 ? (
          <div className="bg-white border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
            Belum ada pertanyaan di sesi ini.
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll, index) => {
              const stats = getPollStats(poll.id)
              return (
                <div key={poll.id} className="bg-white border rounded-xl p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-xs text-gray-500">#{index + 1} • {poll.type.toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${poll.status === 'published' ? 'bg-green-100 text-green-700' : poll.status === 'closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {poll.status}
                        </span>

                        {/* Stats langsung di header card untuk quiz */}
                        {poll.type === "quiz" && stats.total > 0 && (
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border-green-200">
                              Benar: {stats.correct}
                            </span>
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                              Salah: {stats.wrong}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="font-medium text-gray-900">{poll.question}</p>

                      {poll.type === "quiz" && poll.options && (
                        <div className="mt-3 space-y-1.5">
                          {poll.options.sort((a, b) => a.option_order - b.option_order).map((opt) => (
                            <div key={opt.id} className={`text-sm px-3 py-2 rounded-lg border ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                              {opt.option_text} {opt.is_correct && " ✔"}
                            </div>
                          ))}
                        </div>
                      )}

                      {poll.type === "quiz" && stats.total === 0 && (
                        <p className="text-xs text-gray-400 mt-2">Belum ada jawaban masuk</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => void onUpdateSingle(poll.id, "published")} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={poll.status === 'published'}>Publish</button>
                    <button onClick={() => void onUpdateSingle(poll.id, "closed")} className="text-xs px-3 py-1.5 rounded-lg bg-white border text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={poll.status === 'closed'}>Tutup</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionPage