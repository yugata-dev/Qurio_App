"use client";
import { fetchUserParticipant } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
interface ParticipantFormData {
  access_code: string;
  name: string;
  absen: string;
}

export interface ParticipantFormProps {
  sessionId?: string;
  onSuccess?: () => void;
}

export function AccessForm({ onSuccess }: ParticipantFormProps) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParticipantFormData>();

  const handleInputFormParticipant = async (
    dataParticipant: ParticipantFormData,
  ) => {
    setMessage("");
    try {
      const participant = await fetchUserParticipant(
        Number(dataParticipant.access_code),
        dataParticipant.name.trim(),
        Number(dataParticipant.absen),
      );
      const sessionId = participant.data?.session_id;

      if (!sessionId) {
        throw new Error("Sesi tidak ditemukan setelah berhasil bergabung.");
      }

      localStorage.setItem("participant", JSON.stringify(participant));
      localStorage.setItem("participant_id", String(participant.data.id));
      onSuccess?.();
      router.push(`/play/${sessionId}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal bergabung ke sesi.",
      );
    }
  };

  return (
    <form
      id="access"
      className="flex flex-col gap-5 w-full max-w-lg sm:w-4/5 sm:min-w-sm mt-8 pt-8 px-8 pb-8 rounded-3xl bg-card text-card-foreground shadow-lg text-left"
      onSubmit={handleSubmit(handleInputFormParticipant)}
      aria-label="Form masuk ruang kelas"
    >
      <h3 className="text-[18px] mb-7 text-center">Masuk Ruang Kelas Instan</h3>

      {/* Kode Akses */}
      <div>
        <label
          htmlFor="access_code"
          className="text-left block mb-2 text-muted-foreground uppercase tracking-[0.04em] text-xs font-extrabold"
        >
          Kode Akses 6-Digit <span>(Cth: 123456)</span>
        </label>
        <input
          {...register("access_code", {
            required: "Kode akses wajib diisi.",
            pattern: {
              value: /^\d{6}$/,
              message: "Kode harus terdiri dari 6 digit.",
            },
          })}
          id="access_code"
          inputMode="numeric"
          maxLength={6}
          placeholder="Masukkan kode akses"
          className="w-full h-16 px-4 border border-input rounded-xl bg-background text-foreground text-base outline-ring placeholder:text-muted-foreground"
        />
        {errors.access_code && (
          <div className="text-xs font-semibold mt-2 text-red-500">
            {errors.access_code.message}
          </div>
        )}
      </div>

      {/* Nama Lengkap */}
      <div>
        <label
          htmlFor="name"
          className="text-left block mb-2 text-muted-foreground uppercase tracking-[0.04em] text-xs font-extrabold"
        >
          Nama Lengkap Kamu
        </label>
        <input
          {...register("name", { required: "Isi nama anda" })}
          id="name"
          placeholder="Masukkan nama lengkap"
          className="w-full h-16 px-4 border border-input rounded-xl bg-background text-foreground text-base outline-ring placeholder:text-muted-foreground"
        />
        {errors.name && (
          <div className="text-xs font-semibold mt-2 text-red-500">
            {errors.name.message}
          </div>
        )}
      </div>

      {/* Nomor Absen */}
      <div>
        <label
          htmlFor="absen"
          className="text-left block mb-2 text-muted-foreground uppercase tracking-[0.04em] text-xs font-extrabold"
        >
          Nomer Absen Kamu
        </label>
        <input
          {...register("absen", { required: "Nomor absen wajib diisi." })}
          id="absen"
          placeholder="Masukkan nomor absen"
          className="w-full h-16 px-4 border border-input rounded-xl bg-background text-foreground text-base outline-ring placeholder:text-muted-foreground"
        />
        {errors.absen && (
          <div className="text-xs font-semibold mt-2 text-red-500">
            {errors.absen.message}
          </div>
        )}
      </div>

      <Button
        className="w-full inline-flex items-center justify-center gap-3 rounded-[15px] px-6 py-6! border-0 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-primary text-primary-foreground shadow-lg"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sedang memproses..." : "Masuk Sekarang"}{" "}
        <span aria-hidden="true">→</span>
      </Button>

      {message && (
        <p className="mt-3 text-red-700 text-[13px]" role="status">
          {message}
        </p>
      )}

      <p className="mt-4 text-center text-muted-foreground text-xs">
        Tanpa perlu buat akun atau unduh aplikasi.
      </p>
    </form>
  );
}
