"use client"
import { useState, useEffect } from "react"
import { createPolls, getDataSession, getDataType } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useForm } from "react-hook-form"
import { useParams } from "next/navigation"
import { SessionData } from "../../session/[id]/page"

interface pollOption {
  option_text: string
  is_correct: boolean
  option_order: number
}

type statusPoll = 'draft' | 'published' | "closed"

interface formPolls {
  question: string
  option: pollOption[]
  token: string
  sessionId: string
  status: statusPoll
}

interface AnswerOption {
  id: string
  text: string
}

interface Question {
  id: string;
  questionText?: string;
  option?: AnswerOption[];
}

function CreatePollsPage() {
  const { user, token } = useAuth()
  const params = useParams()
  const [inputAppears, setInputAppears] = useState<boolean>(true)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [session, setSession] = useState<SessionData |null>(null)
  const sessionId = params.id

  useEffect(() => {

    const fetchSession = async () => { 
    if (!token || !sessionId) return
    try {
      const dataSession = await getDataSession(sessionId, token)
      setSession(dataSession)
    } catch (error) {
      console.error("gagal mendapat data session:", error)
      setErrorMessage("data sesi gagal didapatkan.")
    }
  }

   void fetchSession()
  }, [sessionId, token])

  const onSubmitPolls = async (dataPolls: formPolls) => {
    if (!user || !token) return alert("Anda harus login terlebih dahulu...")
    try {


      const response = await createPolls(
        "quiz",
        dataPolls.question,
        dataPolls.option.map((option, index) => ({
          text: option.option_text,
          is_correct: option.is_correct,
          option_order: index
        })),
        dataPolls.sessionId,
        token,
        "published"
      )

      if (response.success) {
        alert("Soal yang Guru buat, berhasil terkirim secara live!")
      }

      console.log("hasil data:", response)
    } catch (error) {
      console.error("login error:", error)
    }
  }


  return (
    <form>
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-center">
          Buat Pertanyaan
        </h2>

        <div className="flex flex-col gap-1">
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-bold text-[1.2rem]">
            Pertanyaan Anda:
          </label>
          <textarea
            {...register("question", { required: "Pertanyaan wajib diisi" })}
            className="w-full text-black bg-white rounded border-2 border-black h-32 text-base outline-none py-2 px-3 resize-none font-light"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-[1.2rem]">
            Opsi Jawaban:
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-2 border-amber-600 p-4 rounded-xl">
            <div
              className="p-2 gap-2 flex items-center border-2 border-amber-400 rounded-lg bg-white"
            >
              <input
                className="text-black bg-gray-50 flex-1 rounded p-1 border font-light"
              />
              <input
                type="radio"
                className="w-4 h-4"
              />
              <button
                type="button"
                className="text-red-500 text-sm hover:underline"
              >
                Hapus
              </button>
            </div>

            <button
              type="button"
              className="border-2 border-dashed border-amber-600 rounded-lg p-2 hover:bg-amber-100 text-amber-800 transition"
            >
              + Tambah Opsi
            </button>
          </div>
        </div>
      </div>

      <button
        disabled={isSubmitting}
        className="bg-amber-300 text-xl font-bold rounded-xl p-3 mt-4 hover:bg-amber-400 shadow transition w-full"
        type="submit"
      >
        {isSubmitting ? "Sedang memperoses..." : "Buat Sekarang"}
      </button>
    </form>
  )
}

export default CreatePollsPage