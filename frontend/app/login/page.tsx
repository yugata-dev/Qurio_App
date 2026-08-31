"use client"
import { fetchUserLogin } from "@/lib/api"
import { useForm } from "react-hook-form"
import { useState } from "react" // 1. Tambahkan useState untuk error server
import { useRouter } from "next/navigation" // 2. Tambahkan useRouter untuk redirect

interface FormLogin {
    email: string
    password: string
    role: string
}

function LoginPage() {
    const router = useRouter()
    const [serverError, setServerError] = useState<string | null>(null) // State error dari backend

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormLogin>()

    const onSubmit = async (data: FormLogin) => {
        setServerError(null) // Reset error server setiap kali submit
        try {
            const response = await fetchUserLogin(
                data.email,
                data.password,
                data.role
            )

            console.log("login berhasil", response)

            // Simpan token (jika ada) dan redirect ke dashboard
            router.push("/dashboard")
        } catch (error: any) {
            console.error("login error:", error)
            // Tampilkan pesan error dari backend ke UI
            setServerError(error.message || "Gagal login, periksa kembali data Anda")
        }
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    return (
        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
            <div className="bg-amber-50 w-96 p-6 flex flex-col items-center justify-center rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-black">Login Qurio</h1>

                {/* Tampilkan error dari Server/Backend jika ada */}
                {serverError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 w-full text-sm">
                        {serverError}
                    </div>
                )}

                <form className="w-full text-red-500" onSubmit={handleSubmit(onSubmit)}>
                    {/* EMAIL */}
                    <label className="text-black font-bold block mb-1">EMAIL</label>
                    <input
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        {...register("email", {
                            required: "Email wajib diisi",
                            pattern: {
                                value: emailPattern,
                                message: "Format email tidak valid",
                            },
                        })}
                        type="email"
                    />
                    {errors.email && <span className="text-xs font-semibold block mt-1">{errors.email.message}</span>}

                    {/* PASSWORD */}
                    <label className="text-black font-bold block mb-1 mt-3">PASSWORD</label>
                    <input
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        {...register("password", {
                            required: "Password wajib diisi"
                        })}
                        type="password"
                    />
                    {errors.password && <span className="text-xs font-semibold block mt-1">{errors.password.message}</span>}

                    {/* ROLE (DITAMBAHKAN AGAR TIDAK UNDEFINED) */}
                    <label className="text-black font-bold block mb-1 mt-3">ROLE</label>
                    <select
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        {...register("role", { required: "Role wajib dipilih" })}
                    >
                        <option value="">Pilih Role</option>
                        <option value="guru">Guru</option>
                        <option value="siswa">Siswa</option>
                    </select>
                    {errors.role && <span className="text-xs font-semibold block mt-1">{errors.role.message}</span>}

                    {/* BUTTON SUBMIT */}
                    <button
                        className="border-2 w-full h-10 font-bold rounded-2xl flex justify-center items-center border-black text-white bg-black mt-6 hover:bg-zinc-800 transition disabled:opacity-50"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Mengirim..." : "Kirim"}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage