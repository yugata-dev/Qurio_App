'use client'

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { fetchWordcloudList } from "@/lib/api"

interface WordcloudItem {
  id?: string
  poll_id?: string
  participant_id?: string
  word?: string
  count?: number
  created_at?: string
}

export default function WordcloudPollPage() {
  const params = useParams()
  const sessionId = params?.id as string
  const pollId = params?.pollId as string
  const [items, setItems] = useState<WordcloudItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pollId) return

    const loadWordcloud = async () => {
      try {
        setLoading(true)
        const response = await fetchWordcloudList(pollId)
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
        setItems(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengambil data wordcloud")
      } finally {
        setLoading(false)
      }
    }

    void loadWordcloud()
  }, [pollId])

  const words = useMemo(() => {
    const map = new Map<string, number>()

    items.forEach((item) => {
      const text = (item.word || "").trim()
      if (!text) return
      map.set(text, (map.get(text) || 0) + (item.count || 1))
    })

    return Array.from(map.entries()).map(([text, count]) => ({ text, count }))
  }, [items])

  const maxCount = Math.max(...words.map((word) => word.count), 1)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Session {sessionId}</p>
          <h1 className="mt-2 text-2xl font-black text-gray-900">Wordcloud Response</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-500 text-sm">Memuat wordcloud...</div>
        ) : words.length === 0 ? (
          <div className="bg-white border-dashed rounded-xl p-10 text-center text-gray-500 text-sm">
            Belum ada kata yang dikirim untuk poll ini.
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-center gap-3 min-h-[260px] rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50 p-5">
              {words.map((word, index) => (
                <span
                  key={`${word.text}-${index}`}
                  style={{
                    fontSize: `${0.9 + (word.count / maxCount) * 2.6}rem`,
                    fontWeight: 700,
                    color: ["#111827", "#1d4ed8", "#7c3aed", "#ea580c", "#0f766e", "#be185d"][index % 6],
                    transform: `rotate(${(index % 5) - 2}deg)`,
                    lineHeight: 1,
                  }}
                  className="inline-flex select-none"
                >
                  {word.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
