"use client";
import { fetchUserLogin } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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

interface FormLogin {
  email: string;
  password: string;
  role: string;
  token: string;
}

function LoginPage() {
  const router = useRouter();

  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormLogin>();

  //   useEffect(() => {
  //     if (isAutheticated) {
  //       router.push("/dashboard");
  //     }
  //   }, [isAutheticated, router]);

  const onSubmit = async (data: FormLogin) => {
    try {
      const response = await fetchUserLogin(
        data.email,
        data.password,
        // data.token,
      );

      if (response.success && response.data) {
        const dataUser = response.data.user;
        const dataToken = response.data.token;

        login(dataUser, dataToken);

        alert("Login berhasil..");
      }
      // Simpan token (jika ada) dan redirect ke dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("login error:", error);
    }
  };

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-zinc-100 font-sans min-h-screen p-4">
      <Card className="max-w-120 w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-zinc-900">
            Masuk ke Akun
          </CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            Selamat datang kembali di Qurio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800 ml-[11.2px]">
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
                className="w-full h-11"
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-zinc-800 ml-[11.2px]">
                Password
              </Label>
              <Input
                {...register("password", {
                  required: "Password wajib diisi",
                })}
                placeholder="Masukkan kata sandi Anda"
                type="password"
                className="w-full h-11"
              />
              {errors.password && (
                <span className="text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-6 h-11"
              disabled={isSubmitting}
            >
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
