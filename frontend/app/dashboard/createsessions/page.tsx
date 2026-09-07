"use client"
import { createPolls, createSession } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { useState } from "react";


interface pollOption {
    text: string
    is_correct: boolean
    option_order: number
}

type statusPoll = 'draft' | 'published' | 'closed'

// Hanya cantumkan field yang di-input via form
interface SessionFormInput {
    title: string
    type: string
    question: string
    option: pollOption[]
    correctIndex: number
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

function CreateSessionsPage() {
    const router = useRouter()
    const { user, token } = useAuth()
    const { register, watch, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionFormInput>()
    const { fields, append, remove } = useFieldArray({ control, name: "option" })
    const selectedType = watch("type")

    const onSubmitSession = async (dataSession: SessionFormInput) => {
        if (!user || !token) return alert("Anda harus login terlebih dahulu...")

        try {
            // 1. Buat session
            const postTitleSession = await createSession(dataSession.title, token);
            console.log("Hasil createSession:", postTitleSession); // Cek struktur respons backend

            // 2. Ambil ID (antisipasi jika ID dibungkus di dalam objek .data)
            const newSessionId = postTitleSession.id || (postTitleSession as any).data?.id;

            if (!newSessionId) {
                throw new Error("Gagal mendapatkan ID Sesi dari backend");
            }

            try {
                const optionsWithCorrectFlag = dataSession.option.map((opt, i) => ({
                    text: opt.text,
                    is_correct: i === Number(dataSession.correctIndex),
                    option_order: i
                }))
                if (selectedType === "quiz") {
                    await createPolls(selectedType, dataSession.question, optionsWithCorrectFlag, newSessionId, token, "draft")
                    router.push(`/dashboard/session/${newSessionId}`)
                } else {
                    await createPolls(selectedType, dataSession.question, optionsWithCorrectFlag, newSessionId, token, "published")
                    router.push(`/dashboard/session/${newSessionId}`)
                } alert("Sesi dan soal berhasil dibuat..")
            } catch (error) {
                alert("Sesi berhasil dibuat, tapi soal gagal disimpan. Tambahkan soal lewat halaman sesi.")
            }

        } catch (error: any) {
            console.error("Create session error:", error.message || error);
            alert(`Gagal membuat sesi: ${error.message}`);
        }
    }

    return (
        <section className="flex flex-col items-center justify-center min-h-screen gap-4  p-4">
            {/* Kontainer Utama */}
            <div className="bg-amber-50 w-full max-w-4xl text-black flex flex-col items-center p-6 rounded-2xl font-bold shadow-md">
                <h1 className="text-3xl font-bold mb-6">BUAT SESI & PERTANYAAN</h1>

                {/* Pembungkus Form Tunggal */}
                <form className="w-full max-w-2xl flex flex-col gap-4" onSubmit={handleSubmit(onSubmitSession)}>

                    {/* BAGIAN 1: PEMBUATAN SESI */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xl">Title Sesi:</label>
                        <input
                            {...register("title", { required: "Isi judul yang diinginkan..." })}
                            className="h-10 w-full p-2 text-[1.2rem] border-black border-2 rounded-[0.4rem] font-light bg-white"
                            type="text"
                        />
                        {errors.title && <div className="text-xs font-semibold mt-1 text-red-500">{errors.title.message}</div>}
                    </div>

                    <hr className="border-amber-200 my-4" />

                    {/* BAGIAN 2: PEMBUATAN PERTANYAAN */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-2xl font-bold text-center">Buat Pertanyaan Pertama</h2>

                        <div className="flex flex-col gap-1">
                            <label className="text-xl">Tipe Soal:</label>
                            <p className="font-light text-gray-400"><span className="text-red-500 m-0.3">Alert:</span> Tipe soal hanya bisa dipilih kali ini saja tidak bisa di ganti sepanjang sesi...</p>
                            <select
                                {...register("type", { required: "Pilih type soal.." })}
                                className="border-2 border-black w-full rounded-[5px] p-2 bg-white font-medium"
                            >
                                <option value="">Pilih Tipe Soal</option>
                                <option value="quiz">Quiz</option>
                                <option value="wordcloud">Wordcloud</option>
                                <option value="qa">Tanya Jawab</option>
                            </select>
                            {errors.type && <div className="text-xs font-semibold mt-1 text-red-500">{errors.type.message}</div>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-[1.2rem]">Pertanyaan Anda:</label>
                            {/* Diubah menggunakan {...register} agar nilainya masuk ke React Hook Form */}
                            <textarea
                                {...register("question", { required: "Pertanyaan wajib diisi" })}
                                className="w-full text-black bg-white rounded border-2 border-black h-32 text-base outline-none py-2 px-3 resize-none font-light"
                            />
                            {errors.question && <div className="text-xs font-semibold mt-1 text-red-500">{errors.question.message}</div>}
                        </div>

                        {selectedType === "quiz" && (
                            < div className="flex flex-col gap-2">
                                <label className="font-bold text-[1.2rem]">Opsi Jawaban:</label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-2 border-amber-600 p-4 rounded-xl">
                                    {fields.map((field, i) => (
                                        <div key={field.id} className="p-2 gap-2 flex items-center border-2 border-amber-400 rounded-lg bg-white">
                                            <input
                                                {...register(`option.${i}.text`, { required: "Opsi wajib diisi" })}
                                                placeholder={`Opsi ${i + 1}`}
                                                className="text-black bg-gray-50 flex-1 rounded p-1 border font-light"
                                            />
                                            <input
                                                type="radio"
                                                value={i}
                                                {...register("correctIndex")}
                                                className="w-4 h-4"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => remove(i)}
                                                className="text-red-500 text-sm hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))}


                                    <button
                                        type="button"
                                        onClick={() => append({ text: "", is_correct: false, option_order: fields.length })}
                                        className="border-2 border-dashed border-amber-600 rounded-lg p-2 hover:bg-amber-100 text-amber-800 transition"
                                    >
                                        + Tambah Opsi
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tombol Submit Utama */}
                    <button disabled={isSubmitting} className="bg-amber-300 text-xl font-bold rounded-xl p-3 mt-4 hover:bg-amber-400 shadow transition w-full" type="submit">

                        {isSubmitting ? "Sedang memperoses..." : "Buat Sekarang"}
                    </button>
                </form>
            </div >
        </section >
    )
}

export default CreateSessionsPage