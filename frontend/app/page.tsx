"use client"
import { fetchUserRegister } from "@/lib/api"
import { error } from "next/dist/build/output/log";
import { Span } from "next/dist/server/lib/trace/tracer";
import { useForm } from "react-hook-form"

interface RegisterFormData {
  name: string
  email: string
  password: string
  role: string
}

export default function Home() {

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
      // call login context
      // redirect
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="bg-amber-50 w-96 h-120 p-4 flex flex-col items-start justify-center rounded-2xl">
        <form className="text-red-500" onSubmit={handleSubmit(onSubmit)}>
          <label className="text-black font-bold">NAME</label>
          <input {...register("name", { required: true })} className="border-2 w-full border-black text-black pl-2" placeholder="masukan nama..." />
          {errors.name && <span>Name required</span>}
          <br />
          <label className="text-black  font-bold">EMAIL</label>
          <input     {...register("email", {
            required: "Email required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email format"
            }
          })} className="border-2 w-full border-black text-black pl-2" placeholder="masukan email..." type="email" />
          {errors.email && <span>Email required</span>}
          <br />
          <label className="text-black  font-bold">PASSWORD</label>
          <input {...register("password", { required: true })} className="border-2 w-full border-black text-black pl-2" placeholder="masukan password..." type="text" />
          {errors.password && <span>Password required</span>}
          <br />
          <label className="text-black  font-bold">ROLE</label>
          <select {...register("role", { required: true })} className="border-2 w-full border-black text-black pl-2">
            <option value="">
              Select Role
            </option>
            <option value="guru">
              Guru
            </option>
            <option value="murid">
              Murid
            </option>
          </select>
          <br />
          <button className="border-2 w-full h-10 font-bold rounded-2xl flex justify-center items-center p-2 border-black text-white bg-black mt-4 pl-2">Register</button>
        </form>
      </div>
    </div>
  );
}
