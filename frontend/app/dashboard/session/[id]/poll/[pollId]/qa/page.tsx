'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchQuestionList } from "@/lib/api"

interface QuestionItem {
  id: string
  poll_id: string
  participant_id: string
  question_text: string
  created_at?: string
  participant_name?: string
  answered?: boolean
}

export default function QaPollPage() {
  const params = useParams()
  const sessionId = params?.id as string
  const pollId = params?.pollId as string
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pollId) return

    const loadQuestions = async () => {
      try {
        setLoading(true)
        const response = await fetchQuestionList(pollId)
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
        setQuestions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengambil daftar pertanyaan")
      } finally {
        setLoading(false)
      }
    }

    void loadQuestions()
  }, [pollId])

  const markAsAnswered = (id: string) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Session {sessionId}</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900">Daftar Pertanyaan</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">Memuat pertanyaan...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
            Belum ada pertanyaan masuk untuk poll ini.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((item, index) => (
              <div key={item.id || `${item.participant_id}-${index}`} className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs text-gray-500">#{index + 1} • {item.participant_name || item.participant_id}</p>
                    <p className="mt-2 text-base font-medium text-gray-900">{item.question_text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => markAsAnswered(item.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${item.answered ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}`}
                  >
                    {item.answered ? "Answered" : "Mark as answered"}
                  </button>
                </div>
                {item.created_at && (
                  <p className="mt-3 text-xs text-gray-400">{new Date(item.created_at).toLocaleString("id-ID")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
