"use client";

import { fetchUserParticipant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";

interface ParticipantFormData {
  access_code: string;
  name: string;
  absen: string;
}

export interface ParticipantFormProps {
  sessionId?: string;
  onSuccess?: () => void;
}

export function AccessForm({ sessionId, onSuccess }: ParticipantFormProps) {
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
      const localId = localStorage.getItem("participant_id");
      const participant = await fetchUserParticipant(
        Number(dataParticipant.access_code),
        dataParticipant.name.trim(),
        Number(dataParticipant.absen),
        localId,
      );
      const joinedSessionId = participant.data?.session_id;

      if (!joinedSessionId) {
        throw new Error("Sesi tidak ditemukan setelah berhasil bergabung.");
      }

      if (sessionId && sessionId !== joinedSessionId) {
        throw new Error("Peserta tidak terdaftar pada sesi ini.");
      }

      localStorage.setItem("participant", JSON.stringify(participant));
      localStorage.setItem("participant_id", String(participant.data.id));
      localStorage.setItem("participant_session_id", joinedSessionId);
      onSuccess?.();
      router.push(`/play/${joinedSessionId}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal bergabung ke sesi.",
      );
    }
  };

  return (
    <form
      id="access"
      className="mt-8 flex w-full max-w-lg flex-col gap-5 rounded-3xl bg-card px-8 pb-8 pt-8 text-left text-card-foreground shadow-lg sm:w-4/5 sm:min-w-sm"
      onSubmit={handleSubmit(handleInputFormParticipant)}
      aria-label="Form masuk ruang kelas"
    >
      <h3 className="mb-7 text-center text-[18px]">Masuk Ruang Kelas Instan</h3>

      {/* Kode Akses */}
      <div>
        <label
          htmlFor="access_code"
          className="mb-2 block text-left text-xs font-extrabold uppercase tracking-[0.04em] text-muted-foreground"
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
          className="h-16 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-ring placeholder:text-muted-foreground"
        />
        {errors.access_code && (
          <div className="mt-2 text-xs font-semibold text-red-500">
            {errors.access_code.message}
          </div>
        )}
      </div>

      {/* Nama Lengkap */}
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-left text-xs font-extrabold uppercase tracking-[0.04em] text-muted-foreground"
        >
          Nama Lengkap Kamu
        </label>
        <input
          {...register("name", { required: "Isi nama anda" })}
          id="name"
          placeholder="Masukkan nama lengkap"
          className="h-16 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-ring placeholder:text-muted-foreground"
        />
        {errors.name && (
          <div className="mt-2 text-xs font-semibold text-red-500">
            {errors.name.message}
          </div>
        )}
      </div>

      {/* Nomor Absen */}
      <div>
        <label
          htmlFor="absen"
          className="mb-2 block text-left text-xs font-extrabold uppercase tracking-[0.04em] text-muted-foreground"
        >
          Nomer Absen Kamu
        </label>
        <input
          {...register("absen", { required: "Nomor absen wajib diisi." })}
          id="absen"
          placeholder="Masukkan nomor absen"
          className="h-16 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-ring placeholder:text-muted-foreground"
        />
        {errors.absen && (
          <div className="mt-2 text-xs font-semibold text-red-500">
            {errors.absen.message}
          </div>
        )}
      </div>

      <Button
        className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[15px] border-0 bg-primary px-6 py-6! text-base font-extrabold text-primary-foreground shadow-lg transition-all duration-200 hover:-translate-y-0.5"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sedang memproses..." : "Masuk Sekarang"}{" "}
        <span aria-hidden="true">→</span>
      </Button>

      {message && (
        <p className="mt-3 text-[13px] text-red-700" role="status">
          {message}
        </p>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Tanpa perlu buat akun atau unduh aplikasi.
      </p>
    </form>
  );
}
