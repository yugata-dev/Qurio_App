"use client"

import { useAuth } from "@/context/AuthContext"
import { fetchResponseGetPoll, getAllDataPolls, getDataSession, responseAnswer, updateSinglePolls, updateStatusSession } from "@/lib/api"
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
  const { isAutheticated } = useAuth()
  const [session, setSession] = useState<SessionData | null>(null)
  const [polls, setPolls] = useState<Poll[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [resultAnswer, setResultAnswer] = useState<responseAnswer | null>(null)
  const sessionId = params?.id as string
  const answerRows = resultAnswer?.data ?? []

  useEffect(() => {
    if (!isAutheticated || !sessionId) return;
    const fetchSessionData = async () => {
      try {
        const sessionResponse = await getDataSession(sessionId, null)
        setSession(sessionResponse.data)
      } catch {
        setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.")
      }
    }

    const fetchAnswerStudent = async (pollId: string) => {
      try {
        const answerResponse = await fetchResponseGetPoll(pollId)
        setResultAnswer(answerResponse)
      } catch (error) {
        console.error("terjadi error pengabilan data:", error)
      }
    }

    const fetchPollData = async () => {
      try {
        const pollResponse = await getAllDataPolls(sessionId, null)
        const loadedPolls = Array.isArray(pollResponse) ? pollResponse : []
        setPolls(loadedPolls)

        if (loadedPolls.length > 0) {
          await fetchAnswerStudent(loadedPolls[0].id)
        }
      } catch {
        setErrorMessage("Gagal mengambil data poll")
      }
    }

    void fetchPollData()
    void fetchSessionData()
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Sesi */}
        <div className="bg-white border rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{session?.title || `Sesi ${session?.id}`}</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {session?.id} • Kode: <span className="font-mono font-semibold bg-gray-100 px-2 py-0.5 rounded">{session?.access_code}</span></p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${session?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {session?.status === "ended" ? "Selesai" : "Aktif"}
            </span>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => void toggleSessionStatus("active")} disabled={session?.status === "active"} className="text-sm px-4 py-2 rounded-lg bg-blue-700">Aktifkan</button>
            <button onClick={() => void toggleSessionStatus("ended")} disabled={session?.status === "ended"} className="text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed">Akhiri Sesi</button>
            <button onClick={() => router.push(`/dashboard/createpolls/${session?.id}`)} className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ml-auto">+ Buat Soal</button>
            {/* <p>{answerRows.length > 0 ? answerRows[0].poll_id : "Belum ada jawaban"}</p> */}
          </div>
        </div>

        {/* Alert */}
        {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{errorMessage}</div>}
        {successMessage && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">{successMessage}</div>}

        {/* List Poll */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Daftar Jawaban ({answerRows.length})</h2>

          {answerRows.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
              Belum ada jawaban untuk soal ini.
            </div>
          ) : (
            <div className="space-y-3">
              {answerRows.map((answer, index) => (
                <div key={answer.id} className="bg-white border rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">#{index + 1}</p>
                  <p className="font-medium text-gray-900">Peserta: {answer.participant_name || answer.participant_id}</p>
                  <p className="text-sm text-gray-700 mt-1">Jawaban: {answer.answer || answer.option_text || "-"}</p>
                </div>
              ))}
            </div>
          )}

          <h2 className="font-semibold text-gray-800 mb-3 mt-8">Daftar Pertanyaan ({polls?.length || 0})</h2>

          {!polls || polls.length === 0 ? (
            <div className="bg-white border border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
              Belum ada pertanyaan di sesi ini.
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map((poll, index) => (
                <div key={poll.id} className="bg-white border rounded-xl p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">#{index + 1} • {poll.type.toUpperCase()} • <span className={poll.status === 'published' ? 'text-green-600' : poll.status === 'closed' ? 'text-red-600' : 'text-gray-500'}>{poll.status}</span></p>
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
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => void onUpdateSingle(poll.id, "published")} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={poll.status === 'published'}>Publish</button>
                    <button onClick={() => void onUpdateSingle(poll.id, "closed")} className="text-xs px-3 py-1.5 rounded-lg bg-white border text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled={poll.status === 'closed'}>Tutup</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionPage