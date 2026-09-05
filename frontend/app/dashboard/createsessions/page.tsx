"use client"
import { useState } from "react"
import { createSession, postType } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

interface Session {
    title: string
    type: string
    sessionId: string
    token: string
}

function CreateSessionsPage() {
    const router = useRouter()
    const { user, token } = useAuth()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Session>()


    const onSubmitSession = async (dataSession: Session) => {
        if (!user || !token) return alert("Anda harus login terlebih dahulu...")
        try {
            // 1. Kirim judul + token untuk buat sesi
            const postTitleSession = await createSession(dataSession.title, token);

            // 2. Pastikan ID didapat dari respons backend
            const newSessionId = postTitleSession.id;

            if (!newSessionId) {
                throw new Error("Gagal mendapatkan ID Sesi dari backend");
            }

            // 3. Kirim type hanya jika newSessionId valid
            const postTypeSession = await postType(dataSession.type, newSessionId, token);

            alert("Session berhasil dibuat!");
            router.push(`/dashboard/session/${newSessionId}`);
        } catch (error: any) {
            console.error("login error:", error)
        }
    }


    return (
        <section>
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="bg-amber-50 w-4xl text-black flex items-center flex-col p-2 rounded-2xl font-bold">
                    <h1 className="text-2xl font-bold ">BUAT SESI</h1>
                    <form action="" className="flex items-center flex-col" onSubmit={handleSubmit(onSubmitSession)} >
                        <div className="w-220 gap-2">
                            <label htmlFor="" className="text-2xl" >Tipe:</label>
                            <br />
                            <select {...register(`type`, { required: "Pilih type soal.." })} className="mb-2 border-2 border-black w-full rounded-[5px] p-1">
                                <option value="">Pilih Tipe Soal</option>
                                <option value="quiz">Quiz</option>
                                <option value="wordcloud">Wordcloud</option>
                                <option value="qa">Tanya Jawab</option>
                            </select>
                            {errors.type && <div className="text-xs font-semibold block mt-1 text-red-500">{errors.type.message}</div>}
                            <br />
                            <label htmlFor="" className="text-2xl" >Title:</label>
                            <br />
                            <input {...register("title", { required: "Isi judul yang diingingkan..." })} className="h-10 w-full p-2 text-[1.2rem] border-black border-2 rounded-[0.4rem] mb-2 font-light" type="text" />
                            {errors.title && <div className="text-xs font-semibold block mt-1 text-red-500">{errors.title.message}</div>}
                        </div>
                        <button className="bg-amber-200 rounded-[0.3rem] p-2" type="submit" disabled={isSubmitting} >Buat Sekarang</button>
                    </form>
                </div>
            </div>
        </section>
    )
}


export default CreateSessionsPage