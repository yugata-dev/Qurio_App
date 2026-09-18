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
    participant_id: string | null
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

    const handleInputFormParticipant = async (dataParticipant: ParticipantFormData) => {
        setMessage("");
        try {
            const localId = localStorage.getItem("participant_id")
            const participant = await fetchUserParticipant(
                Number(dataParticipant.access_code),
                dataParticipant.name.trim(),
                Number(dataParticipant.absen),
                localId
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
            setMessage(error instanceof Error ? error.message : "Gagal bergabung ke sesi.");
        }
    };

    return (
        <form
            id="access"
            className="max-w-lg mt-8 pt-8 px-8 pb-8 rounded-3xl bg-white shadow-[0_22px_35px_rgba(30,44,70,0.14)]"
            onSubmit={handleSubmit(handleInputFormParticipant)}
            aria-label="Form masuk ruang kelas"
        >
            <h3 className="text-[18px] mb-7">Masuk Ruang Kelas Instan</h3>

            {/* Kode Akses */}
            <label
                htmlFor="access_code"
                className="text-left block mb-2 text-[#8fa0ba] uppercase tracking-[0.04em] text-xs font-extrabold"
            >
                Kode Akses 6-Digit <span>(Cth: 123456)</span>
            </label>

            {errors.access_code && (
                <div className="text-xs font-semibold mt-1 text-red-500">
                    {errors.access_code.message}
                </div>
            )}
            <input
                {...register("access_code", {
                    required: "Kode akses wajib diisi.",
                    pattern: { value: /^\d{6}$/, message: "Kode harus terdiri dari 6 digit." },
                })}
                id="access_code"
                inputMode="numeric"
                maxLength={6}
                placeholder="Masukkan kode akses"
                className="w-full h-16 mb-5 px-4 border border-[#dae3ef] rounded-xl bg-[#f8fafc] text-[#101a31] text-base outline-brand-purple"
            />


            {/* Nama Lengkap */}

            <label
                htmlFor="name"
                className="text-left block mb-2 text-[#8fa0ba] uppercase tracking-[0.04em] text-xs font-extrabold"
            >
                Nama Lengkap Kamu
            </label>
            {errors.name && (
                <div className="text-xs font-semibold mt-1 text-red-500">
                    {errors.name.message}
                </div>
            )}
            <input
                {...register("name", { required: "Isi nama anda..." })}
                id="name"
                placeholder="Masukkan nama lengkap"
                className="w-full h-16 mb-5 px-4 border border-[#dae3ef] rounded-xl bg-[#f8fafc] text-[#101a31] text-base outline-brand-purple"
            />


            {/* Nomor Absen */}

            <label
                htmlFor="absen"
                className="text-left block mb-2 text-[#8fa0ba] uppercase tracking-[0.04em] text-xs font-extrabold"
            >
                Nomer Absen Kamu
            </label>
            {errors.absen && (
                <div className="text-xs font-semibold mt-1 text-red-500">
                    {errors.absen.message}
                </div>
            )}
            <input
                {...register("absen", { required: "Nomor absen wajib diisi." })}
                id="absen"
                placeholder="Masukkan nomor absen"
                className="w-full h-16 mb-5 px-4 border border-[#dae3ef] rounded-xl bg-[#f8fafc] text-[#101a31] text-base outline-brand-purple"
            />

            <Button
                className="w-full inline-flex items-center justify-center gap-3 rounded-[15px] px-6 py-6! border-0 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-primary text-white shadow-[0_12px_25px_rgba(14,165,233,0.2)]"
                type="submit"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Sedang memproses..." : "Masuk Sekarang"}{" "}
                <span aria-hidden="true">→</span>
            </Button>

            {
                message && (
                    <p className="mt-3 text-red-700 text-[13px]" role="status">
                        {message}
                    </p>
                )
            }

            <p className="mt-4 text-center text-[#8b9ab0] text-xs">
                Tanpa perlu buat akun atau unduh aplikasi.
            </p>
        </form >
    );
}