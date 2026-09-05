"use client"
import { fetchUserRegister } from "@/lib/api"
import { useForm } from "react-hook-form"
import RegisterPage from "./(auth)/register/page";
import Link from "next/link";

export default function Home() {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Selamat Datang di Qurio App</h1>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-4 py-2 bg-black text-white rounded-lg font-bold"
        >
          Ke Halaman Register
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border-2 border-black rounded-lg font-bold"
        >
          Ke Halaman Login
        </Link>
      </div>
    </div>
  );
}