"use client"

import { useAuth } from "@/context/AuthContext"
import { getAllDataPolls, getDataSession, updateSinglePolls, updateStatusSession } from "@/lib/api"
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

export interface ApiResponse<T> {
  success: boolean
  data: T
}



function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const { token, login } = useAuth()
  const [session, setSession] = useState<SessionData | null>(null)
  const [polls, setPolls] = useState<Poll[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const sessionId = params?.id as string
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        setErrorMessage("Gagal mengambil data poll")
      }
    }

    void fetchPollData()
    void fetchSessionData()
  }, [sessionId, token])

  // 1. Terima pollId sebagai parameter pertama
  const onUpdateSingle = async (pollId: string, statusTarget: Poll["status"]) => {
    if (!token || !login) {
      setErrorMessage("Token tidak sesuai atau kedaluarsa..")
      return
    }

    if (!polls || polls.length === 0) {
      setErrorMessage("Tidak ada data poll untuk diupdate.");
      return;
    }

    try {
      // 2. HAPUS baris 'const pollId = polls?.[0]?.id' 
      // Gunakan pollId yang dikirim dari parameter
      const updateSingle = await updateSinglePolls(
        pollId,
        statusTarget === "closed" ? "closed" : "published",
        token,
      )

      setPolls((prevPolls) => {
        if (!prevPolls) return null

        return prevPolls.map((oldPoll) => {
          if (oldPoll.id === updateSingle.id) {
            // Gabungkan data update dari backend dan pertahankan options jika backend tidak mengembalikannya
            return {
              ...updateSingle,
              options: updateSingle.options || oldPoll.options
            }
          }
          return oldPoll
        })
      })

      setSuccessMessage(`Berhasil mengupdate poll menjadi ${statusTarget}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengupdate status."
      );
    }
  }

  const toggleSessionStatus = async (statusTarget: SessionData["status"]) => {
    if (!token || !login) {
      setErrorMessage("Token tidak sesuai atau sudah kedaluwarsa.")
      return
    }

    try {
      const updatedSession = await updateStatusSession(sessionId, statusTarget, token)
      setSession(updatedSession)
      setErrorMessage(null)
      setSuccessMessage(
        statusTarget === "ended"
          ? "Sesi berhasil diakhiri."
          : "Sesi berhasil diaktifkan."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengubah status sesi."
      )
    }
  }


  return (
    <div>
      <h1>ID Sesi saat ini: {session?.id}</h1>
      <p> kode Sesi: {session?.access_code} </p>
      <p>Status sesi: {session?.status === "ended" ? "Selesai" : "Aktif"}</p>
      <button
        type="button"
        onClick={() => void toggleSessionStatus("active")}
        disabled={session?.status === "active"}
      >
        Aktifkan Sesi
      </button>
      <button
        type="button"
        onClick={() => void toggleSessionStatus("ended")}
        disabled={session?.status === "ended"}
      >
        Akhiri Sesi
      </button>
      <button onClick={() => router.push(`/dashboard/createpolls/${session?.id}`)}>BUAT SOAL</button>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      {!polls || polls.length === 0 ? (
        <p>Belum ada pertanyaan di sesi ini.</p>
      ) : (
        polls?.map((poll, index) => {
          return poll.type === "quiz" ? (<div key={poll.id} className="m-1">
            poll_id: {poll.id} <br />
            No: {index + 1} <br /> Type:{poll.type} <br /> {poll.options?.map((opt, index) => (<div key={index}>No: {opt.option_order} Opsi jawaban:{opt.option_text} {opt.is_correct ? "✔️" : null}</div>))} Pertanyaan:{poll.question} <br /> status: {poll.status}
            <br />
            <button
              type="button"
              onClick={() => void onUpdateSingle(poll.id, "published")}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Publikasikan Semua
            </button>
            <button
              type="button"
              onClick={() => void onUpdateSingle(poll.id, "closed")}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Tutup Semua
            </button>
          </div>) : (<div key={poll.id}>
            No: {index + 1} <br /> Type:{poll.type} <br /> Pertanyaan:{poll.question}
          </div>)
        })
      )}
    </div>
  )
}

export default SessionPage