"use client"

import { useAuth } from "@/context/AuthContext"
import { getAllDataPolls, getDataSession } from "@/lib/api"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface SessionData {
  id: string
  title: string
  access_code: number
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
  options: []
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

function SessionPage() {
  const params = useParams()
  const { token } = useAuth()
  const [session, setSession] = useState<SessionData | null>(null)
  const [polls, setPolls] = useState<Poll[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const sessionId = params?.id as string

  useEffect(() => {
    if (!token || !sessionId) return

    const fetchSessionData = async () => {
      try {
        const sessionResponse = await getDataSession(sessionId, token)
        setSession(sessionResponse.data)
      } catch (error) {
        console.error("Gagal mengambil data sesi:", error)
        setErrorMessage("Sesi tidak ditemukan atau sudah tidak tersedia.")
      }
    }

    const fetchPollData = async () => {
      try {
        const pollResponse = await getAllDataPolls(sessionId, token)
        setPolls(Array.isArray(pollResponse) ? pollResponse : [])
      } catch (error) {
        console.error("Gagal mengambil data poll:", error)
      }
    }

    void fetchPollData()
    void fetchSessionData()
  }, [sessionId, token])

  return (
    <div>
      <h1>ID Sesi saat ini: {session?.id}</h1>
      <p> kode Sesi: {session?.access_code} </p>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {!polls || polls.length === 0 ? (
        <p>Belum ada pertanyaan di sesi ini.</p>
      ) : (
        polls.map((poll, index) => (
          <div key={poll.id}>
            No: {index + 1} <br /> Pertanyaan:{poll.question}
          </div>
        ))
      )}
    </div>
  )
}

export default SessionPage