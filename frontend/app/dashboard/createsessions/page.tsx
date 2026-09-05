"use client"
import { createSession, postType } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

// Hanya cantumkan field yang di-input via form
interface SessionFormInput {
    title: string
    type: string
}

function CreateSessionsPage() {
    const router = useRouter()
    const { user, token } = useAuth()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionFormInput>()

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

    return (
        <section>
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="bg-amber-50 w-4xl text-black flex items-center flex-col p-2 rounded-2xl font-bold">
                    <h1 className="text-2xl font-bold">BUAT SESI</h1>
                    <form className="flex items-center flex-col" onSubmit={handleSubmit(onSubmitSession)}>
                        <div className="w-220 gap-2">
                            <label className="text-2xl">Tipe:</label>
                            <br />
                            <select {...register("type", { required: "Pilih type soal.." })} className="mb-2 border-2 border-black w-full rounded-[5px] p-1">
                                <option value="">Pilih Tipe Soal</option>
                                <option value="quiz">Quiz</option>
                                <option value="wordcloud">Wordcloud</option>
                                <option value="qa">Tanya Jawab</option>
                            </select>
                            {errors.type && <div className="text-xs font-semibold block mt-1 text-red-500">{errors.type.message}</div>}
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
            </div>
        </section>
    )
}

export default CreateSessionsPage