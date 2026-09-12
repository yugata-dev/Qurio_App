"use client";
import { fetchUserRegister } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
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

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: "guru" | "siswa";
}

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    console.log("Form data:", data);
    try {
      await fetchUserRegister(data.name, data.email, data.password, data.role);
      alert("Register berhasil");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-zinc-100 font-sans min-h-screen p-4">
      <Card className="max-w-120 w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-zinc-900">
            Daftar Akun Baru
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            Bergabung dengan Qurio untuk pengalaman kelas interaktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800">
                Nama Lengkap
              </Label>
              <Input
                {...register("name", { required: "Nama wajib diisi" })}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full h-11"
              />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800">
                Email
              </Label>
              <Input
                {...register("email", {
                  required: "Email wajib diisi",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Format email tidak valid",
                  },
                })}
                className="w-full h-11"
                placeholder="nama@gmail.com"
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
                {...register("password", { required: "Password wajib diisi", minLength: {value: 8, message: "Password minimal 8 karakter"} })}
                className="w-full h-11"
                placeholder="Buat kata sandi minimal 8 karakter"
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
              <Controller
                name="role"
                control={control}
                rules={{ required: "Role wajib dipilih" }}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-11!">
                      <SelectValue placeholder="Pilih role Anda" />
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      sideOffset={4}
                      alignItemWithTrigger={false}
                    >
                      <SelectItem value="guru" className="h-11!">
                        Guru
                      </SelectItem>
                      <SelectItem value="siswa" className="h-11!">
                        Siswa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.role && (
                <span className="text-xs text-red-500">
                  {errors.role.message}
                </span>
              )}
            </div>

            <Button type="submit" className="w-full mt-6 h-11">
              Daftar
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
