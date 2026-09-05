"use client"
import { fetchUserRegister } from "@/lib/api"
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form"

interface RegisterFormData {
    name: string
    email: string
    password: string
    role: string
}

export default function RegisterPage() {
    const router = useRouter()
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>()

    const onSubmit = async (data: RegisterFormData) => {
        console.log("Form data:", data)
        try {
            const response = await fetchUserRegister(
                data.name,
                data.email,
                data.password,
                data.role
            )
            alert("Register berhasil")
            router.push("/dashboard")
        } catch (error) {
            console.error(error)
        }
    }

    return (
        // ------------------------------------------------------------------------------------------ //

        //----------------------------------- FORM REGISTER ----------------------------------------- //

        // ------------------------------------------------------------------------------------------ //

        <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
            <div className="bg-amber-50 w-96 p-6 flex flex-col items-center justify-center rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-black">Register Qurio</h1>
                <form className="text-red-500 w-full" onSubmit={handleSubmit(onSubmit)}>

                    <label className="text-black font-bold block mb-1">NAME</label>
                    <input
                        {...register("name", { required: "Name required" })}
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        placeholder="masukan nama..."
                    />
                    {errors.name && <span className="text-xs">{errors.name.message}</span>}

                    <label className="text-black font-bold block mt-3 mb-1">EMAIL</label>
                    <input
                        {...register("email", {
                            required: "Email required",
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email format"
                            }
                        })}
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        placeholder="masukan email..."
                        type="email"
                    />
                    {errors.email && <span className="text-xs">{errors.email.message}</span>}

                    <label className="text-black font-bold block mt-3 mb-1">PASSWORD</label>
                    <input
                        {...register("password", { required: "Password required" })}
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                        placeholder="masukan password..."
                        type="password"
                    />
                    {errors.password && <span className="text-xs">{errors.password.message}</span>}

                    <label className="text-black font-bold block mt-3 mb-1">ROLE</label>
                    <select
                        {...register("role", { required: "Role required" })}
                        className="border-2 w-full border-black text-black pl-2 py-1 rounded"
                    >
                        <option value="">Select Role</option>
                        <option value="guru">Guru</option>
                        {/* DIPERBAIKI: Mengubah "murid" menjadi "siswa" agar sesuai dengan Backend */}
                        <option value="siswa">Siswa</option>
                    </select>
                    {errors.role && <span className="text-xs">{errors.role.message}</span>}

                    <button
                        type="submit"
                        className="border-2 w-full h-10 font-bold rounded-2xl flex justify-center items-center border-black text-white bg-black mt-6 hover:bg-zinc-800 transition"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}