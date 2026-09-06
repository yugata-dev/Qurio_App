"use client"
import { createSession, postType } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useState } from "react";

// Hanya cantumkan field yang di-input via form
interface SessionFormInput {
    title: string
    type: string
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
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionFormInput>()
    const [inputAppears, setInputAppears] = useState<boolean>(true)

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

            // 3. Simpan type ke poll
            await postType(dataSession.type, newSessionId, token);

            alert("Session berhasil dibuat!");

            // 4. Pindah ke halaman detail session
            router.push(`/dashboard/session/${newSessionId}`);
        } catch (error: any) {
            console.error("Create session error:", error.message || error);
            alert(`Gagal membuat sesi: ${error.message}`);
        }
    }

    const handleAppears = (e: React.MouseEvent, status: boolean) => {
        e.stopPropagation
        setInputAppears(status)
    }

    const questions: Question = {
        id: "q-1",
        questionText: "test",
        option: [
            { id: "A", text: "test1" },
            { id: "B", text: "test2" },
            { id: "C", text: "test3" },
            { id: "D", text: "test4" }
        ]
    }


    return (
        <section>
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="bg-amber-50 w-4xl text-black flex items-center flex-col p-2 rounded-2xl font-bold">
                    <h1 className="text-2xl font-bold">BUAT SESI</h1>
                    <form className="flex items-center flex-col" onSubmit={handleSubmit(onSubmitSession)}>
                        <div className="w-220 gap-2">
                            <br />
                            <label className="text-2xl">Title:</label>
                            <br />
                            <input {...register("title", { required: "Isi judul yang diinginkan..." })} className="h-10 w-full p-2 text-[1.2rem] border-black border-2 rounded-[0.4rem] mb-2 font-light" type="text" />
                            {errors.title && <div className="text-xs font-semibold block mt-1 text-red-500">{errors.title.message}</div>}
                        </div>
                        <button className="bg-amber-200 rounded-[0.3rem] p-2 cursor-pointer disabled:opacity-50" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Memproses..." : "Buat Sekarang"}
                        </button>
                    </form>
                </div>
                <div className="bg-amber-50 w-4xl text-black flex items-center flex-col p-2 rounded-2xl font-bold">
                    <h1 className="text-2xl font-bold">BUAT PERTANYAAN</h1>
                    <form className="text-gray-400 flex w-full flex-col">
                        <label className="text-2xl">Tipe:</label>
                        <select {...register("type", { required: "Pilih type soal.." })} className="mb-2 border-2 border-black w-full rounded-[5px] p-1">
                            <option value="">Pilih Tipe Soal</option>
                            <option value="quiz">Quiz</option>
                            <option value="wordcloud">Wordcloud</option>
                            <option value="qa">Tanya Jawab</option>
                        </select>

                        <label className="font-bold text-[1.2rem] mt-2">Pertanyaan Anda:</label>
                        <textarea className="w-full text-black bg-white rounded border border-gray-txt  h-32 text-base outline-none text-gray-txt py-1 px-3 resize-none"></textarea>
                        <label className="font-bold text-[1.2rem] mt-2">Opsi Jawaban:</label>
                        <div className="grid grid-cols-2 gap-4 w-full border-2 border-amber-600 mx-auto p-4 ">
                            {
                                questions.option?.map((options) => (
                                    <div key={options.id} className="p-2 gap-2 justify-between flex border-2 border-amber-600">
                                        <label htmlFor=""> <span className="bg-amber-300 p-1 rounded-lg font-extrabold">{options.id}</span> <span className="font-bold">{options.text}</span> </label>
                                        <input type="radio" />
                                    </div>
                                ))
                            }
                        </div>
                        <div>
                            <button type="button" className="flex justify-start m-4 text-blue-500 font-extrabold" onClick={(e) => handleAppears(e, false)} >
                                + Tambah Opsi
                            </button>
                            {
                                inputAppears ? null :
                                    <div>
                                        <label htmlFor="" className="p-2">SOAL:</label>
                                        <input type="text" className="rounded border border-gray-txt bg-white p-1 m-2 text-black" />
                                        <button className="bg-amber-200 rounded-lg p-1" onClick={(e) => handleAppears(e, true)} type="button">Buat Opsi Baru</button>
                                    </div>
                            }
                        </div>
                        <button className="bg-amber-200 rounded-[0.3rem] p-2" type="submit">Buat Sekarang</button>
                    </form>
                </div>
            </div>
        </section>
    )
}

export default CreateSessionsPage