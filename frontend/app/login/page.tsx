"use client";
import { fetchUserLogin } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormLogin {
  email: string;
  password: string;
  role: string;
}

// komponen alert success dan failed

function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>();

  const onSubmit = async (data: FormLogin) => {
    setServerError(null);
    try {
      if (!data.role || (data.role !== "guru" && data.role !== "siswa")) {
        setServerError("Role wajib dipilih");
        return;
      }

      const response = await fetchUserLogin(
        data.email,
        data.password,
        data.role,
      );

      if (!response.success) {
        if (response && "message" in response) {
          setServerError(response.message);
        }
        return;
      }

      if (response && "data" in response)
        console.log("login berhasil", response?.data);

      router.push("/dashboard");
    } catch (error: any) {
      console.error("login error:", error);
      setServerError(error.message || "Gagal login, periksa kembali data Anda");
    }
  };

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans min-h-screen">
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <span className="size-3 rounded-full bg-blue-600" />
        <span className="text-lg font-bold text-zinc-900">Qurio</span>
      </div>

      <Card className="w-95 rounded-2xl shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-zinc-900">
            Masuk ke Akun
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            Selamat datang kembali di Qurio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 w-full text-sm">
              {serverError}
            </div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800">
                Email
              </Label>
              <Input
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: emailPattern,
                    message: "Format email tidak valid",
                  },
                })}
                placeholder="nama@sekolah.sch.id"
                type="email"
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800">
                Password
              </Label>
              <Input
                {...register("password", {
                  required: "Password wajib diisi",
                })}
                placeholder="Masukkan kata sandi Anda"
                type="password"
              />
              {errors.password && (
                <span className="text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800">
                Role
              </Label>
              <Select {...register("role", { required: "Role wajib dipilih" })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="siswa">Siswa</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <span className="text-xs text-red-500">
                  {errors.role.message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Mengirim..." : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:underline"
            >
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
