"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { createPolls, createSession } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

interface PollOption {
  text: string
  is_correct: boolean
  option_order: number
}

type PollStatus = "draft" | "published" | "closed"

interface SessionFormInput {
  title: string
  type: string
  question: string
  option: PollOption[]
  correctIndex: number
}

function CreateSessionsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const {
    register,
    watch,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormInput>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "option",
  })
  const selectedType = watch("type")

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const buildOptionsPayload = (
    options: PollOption[],
    correctIndex: number,
  ) =>
    options.map((option, index) => ({
      text: option.text,
      is_correct: index === Number(correctIndex),
      option_order: index,
    }))

  const handleSubmitSession = async (formData: SessionFormInput) => {
    if (!user || !token) {
      setErrorMessage("Anda harus login terlebih dahulu...")
      return
    }

    try {
      const createdSession = await createSession(formData.title, token)
      const newSessionId = createdSession?.id

      if (!newSessionId) {
        throw new Error("Gagal mendapatkan ID Sesi dari backend")
      }

      try {
        const optionsPayload = buildOptionsPayload(
          formData.option,
          formData.correctIndex,
        )

        const pollStatus: PollStatus =
          formData.type === "quiz" ? "draft" : "published"

        await createPolls(
          formData.type,
          formData.question,
          optionsPayload,
          newSessionId,
          token,
          pollStatus,
        )

        setSuccessMessage("Sesi dan soal berhasil dibuat..")
        router.push(`/dashboard/session/${newSessionId}`)
      } catch (pollError) {
        console.error("Gagal menyimpan poll pertama:", pollError)
        setErrorMessage(
          "Sesi berhasil dibuat, tapi soal gagal disimpan. Tambahkan soal lewat halaman sesi.",
        )
      }
    } catch (error) {
      console.error("Gagal membuat sesi:", error)
      setErrorMessage(`Gagal membuat sesi: ${error}`)
    }
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <div className="bg-amber-50 w-full max-w-4xl text-black flex flex-col items-center p-6 rounded-2xl font-bold shadow-md">
        <h1 className="text-3xl font-bold mb-6">BUAT SESI & PERTANYAAN</h1>

        {errorMessage && (
          <div className="text-red-500 font-semibold text-sm mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="text-green-600 font-semibold text-sm mb-4">
            {successMessage}
          </div>
        )}

        <form
          className="w-full max-w-2xl flex flex-col gap-4"
          onSubmit={handleSubmit(handleSubmitSession)}
        >
          <div className="flex flex-col gap-1">
            <label className="text-xl">Title Sesi:</label>
            <input
              {...register("title", { required: "Isi judul yang diinginkan..." })}
              className="h-10 w-full p-2 text-[1.2rem] border-black border-2 rounded-[0.4rem] font-light bg-white"
              type="text"
            />
            {errors.title && (
              <div className="text-xs font-semibold mt-1 text-red-500">
                {errors.title.message}
              </div>
            )}
          </div>

          <hr className="border-amber-200 my-4" />

          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-bold text-center">
              Buat Pertanyaan Pertama
            </h2>

            <div className="flex flex-col gap-1">
              <label className="text-xl">Tipe Soal:</label>
              <p className="font-light text-gray-400">
                <span className="text-red-500 m-0.3">Alert:</span> Tipe soal
                hanya bisa dipilih kali ini saja tidak bisa di ganti sepanjang
                sesi...
              </p>
              <select
                {...register("type", { required: "Pilih type soal.." })}
                className="border-2 border-black w-full rounded-[5px] p-2 bg-white font-medium"
              >
                <option value="">Pilih Tipe Soal</option>
                <option value="quiz">Quiz</option>
                <option value="wordcloud">Wordcloud</option>
                <option value="qa">Tanya Jawab</option>
              </select>
              {errors.type && (
                <div className="text-xs font-semibold mt-1 text-red-500">
                  {errors.type.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[1.2rem]">
                Pertanyaan Anda:
              </label>
              <textarea
                {...register("question", { required: "Pertanyaan wajib diisi" })}
                className="w-full text-black bg-white rounded border-2 border-black h-32 text-base outline-none py-2 px-3 resize-none font-light"
              />
              {errors.question && (
                <div className="text-xs font-semibold mt-1 text-red-500">
                  {errors.question.message}
                </div>
              )}
            </div>

            {selectedType === "quiz" && (
              <div className="flex flex-col gap-2">
                <label className="font-bold text-[1.2rem]">
                  Opsi Jawaban:
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-2 border-amber-600 p-4 rounded-xl">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-2 gap-2 flex items-center border-2 border-amber-400 rounded-lg bg-white"
                    >
                      <input
                        {...register(`option.${index}.text`, {
                          required: "Opsi wajib diisi",
                        })}
                        placeholder={`Opsi ${index + 1}`}
                        className="text-black bg-gray-50 flex-1 rounded p-1 border font-light"
                      />
                      <input
                        type="radio"
                        value={index}
                        {...register("correctIndex")}
                        className="w-4 h-4"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      append({
                        text: "",
                        is_correct: false,
                        option_order: fields.length,
                      })
                    }
                    className="border-2 border-dashed border-amber-600 rounded-lg p-2 hover:bg-amber-100 text-amber-800 transition"
                  >
                    + Tambah Opsi
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={isSubmitting}
            className="bg-amber-300 text-xl font-bold rounded-xl p-3 mt-4 hover:bg-amber-400 shadow transition w-full"
            type="submit"
          >
            {isSubmitting ? "Sedang memperoses..." : "Buat Sekarang"}
          </button>
        </form>
      </div>
    </section>
  )
}

export default CreateSessionsPage