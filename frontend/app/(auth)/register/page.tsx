"use client";
import { fetchUserRegister } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { email, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// interface RegisterFormData {
//   name: string;
//   email: string;
//   password: string;
//   role: "guru" | "siswa";
// }

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .string()
    .email("Email tidak valid")
    .endsWith("gmail.com", "Isi input dengan format (gmail.com) "),
  password: z.string().min(9, "Password minimal 8 karakter"),
  role: z.string(),
});

type RegisterFormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    console.log("Form data:", data);
    try {
      const response = await fetchUserRegister(
        data.name,
        data.email,
        data.password,
        data.role,
      );
      login(response.data.user);
      alert("Register berhasil");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat registrasi.";

      if (message.toLowerCase().includes("email")) {
        setError("email", {
          type: "server",
          message: "Email ini sudah terdaftar. Silakan gunakan email lain.",
        });
      } else {
        alert(message);
      }
    }
  };

  return (
    <div className="relative flex flex-col flex-1 items-center justify-center bg-secondary/80 font-sans min-h-screen p-4">
      <Card className="max-w-120 w-full shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
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
              <Label className="text-sm font-semibold text-foreground">
                Nama Lengkap
              </Label>
              <Input
                {...register("name", { required: "Nama wajib diisi" })}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full h-11"
              />
              {errors.name && (
                <span className="text-xs text-destructive">
                  {errors.name.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-foreground">
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
                <span className="text-xs text-destructive">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <InputGroup className="w-full h-11">
                <InputGroupInput
                  {...register("password", {
                    required: "Password wajib diisi",
                    minLength: {
                      value: 8,
                      message: "Password minimal 8 karakter",
                    },
                  })}
                  className="h-11"
                  placeholder="Buat kata sandi minimal 8 karakter"
                  type={showPassword ? "text" : "password"}
                />
                <InputGroupButton
                  type="button"
                  size="icon-sm"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  title={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </InputGroupButton>
              </InputGroup>
              {errors.password && (
                <span className="text-xs text-destructive">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-foreground">
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
                <span className="text-xs text-destructive">
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
