"use client";

import { IconChartBar, IconMessages, IconCheck } from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { createPolls, createSession } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PollOption {
  text: string;
  is_correct: boolean;
  option_order: number;
}

type PollStatus = "draft" | "published" | "closed";

const questionTypeItems = {
  quiz: "Quiz",
  wordcloud: "Wordcloud",
  qa: "Tanya Jawab",
  polling: "Polling",
};

interface SessionFormInput {
  title: string;
  class_size: number | null;
  mode: "interactive" | "quiz";
  type: string;
  question: string;
  correctIndex: number;
  option: PollOption[];
}

function CreateSessionsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    register,
    watch,
    setValue,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormInput>({
    defaultValues: {
      mode: "quiz",
      class_size: 30,
      type: "quiz",
      correctIndex: 0,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "option",
  });

  const selectedType = watch("type");
  const selectedMode = watch("mode");

  useEffect(() => {
    if (selectedMode === "quiz") {
      setValue("type", "quiz");
    } else if (selectedType === "quiz") {
      setValue("type", "wordcloud");
    }
  }, [selectedMode, selectedType, setValue]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorOpsiPertama = errors.option?.[0]?.text;

  const buildOptionsPayload = (
    options: PollOption[],
    correctIndex: number,
    hasCorrectAnswer: boolean,
  ) =>
    options.map((option, index) => ({
      text: option.text,
      is_correct: hasCorrectAnswer && index === Number(correctIndex),
      option_order: index,
    }));

  const handleSubmitSession = async (formData: SessionFormInput) => {
    if (!user || !isAuthenticated) {
      setErrorMessage("Anda harus login terlebih dahulu...");
      return;
    }

    try {
      const normalizedClassSize =
        formData.class_size === undefined || formData.class_size === null
          ? null
          : Number(formData.class_size);

      const createdSession = await createSession(
        formData.title,
        normalizedClassSize,
        formData.mode,
      );
      const newSessionId = createdSession?.id;

      if (!newSessionId) {
        throw new Error("Gagal mendapatkan ID Sesi dari backend");
      }

      try {
        const optionsPayload = buildOptionsPayload(
          formData.option,
          formData.correctIndex,
          formData.type === "quiz",
        );

        const pollStatus: PollStatus =
          formData.type === "quiz" ? "draft" : "published";

        await createPolls(
          formData.type,
          formData.question,
          optionsPayload,
          newSessionId,
          "",
          pollStatus,
        );

        setSuccessMessage("Sesi dan soal berhasil dibuat..");
        router.push(`/dashboard/session/${newSessionId}`);
      } catch (pollError) {
        console.error("Gagal menyimpan poll pertama:", pollError);
        setErrorMessage(
          "Sesi berhasil dibuat, tapi soal gagal disimpan. Tambahkan soal lewat halaman sesi.",
        );
      }
    } catch (error) {
      console.error("Gagal membuat sesi:", error);
      setErrorMessage(
        error instanceof Error
          ? `Gagal membuat sesi: ${error.message}`
          : "Gagal membuat sesi. Silakan coba lagi.",
      );
    }
  };

  return (
    <section className="mx-auto w-full max-w-[800px] p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
          Buat Sesi Baru
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mulai kelas dengan satu pertanyaan pembuka. Setelah sesi dibuat, kamu
          bisa menambah pertanyaan lain dari halaman sesi.
        </p>
      </header>

      <Card className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardContent className="p-5 sm:p-6">
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 text-sm font-semibold text-destructive"
            >
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div
              role="status"
              className="mb-4 text-sm font-semibold text-green-600"
            >
              {successMessage}
            </div>
          )}

          <form
            className="flex w-full flex-col gap-5"
            onSubmit={handleSubmit(handleSubmitSession)}
          >
            <div className="flex flex-col gap-3">
              <Label>Tipe Sesi</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue("mode", "quiz")}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                    selectedMode === "quiz"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <span className="font-semibold"><IconChartBar className="size-4" />Sesi Quiz</span>
                  <p className="text-xs text-muted-foreground">
                    Ada nilai. Cocok untuk ujian, pre-test, atau kuis penilaian. Hanya bisa berisi soal quiz.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("mode", "interactive")}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                    selectedMode === "interactive"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <span className="font-semibold"><IconMessages className="size-4" />Sesi Interaktif</span>
                  <p className="text-xs text-muted-foreground">
                    Tanpa nilai. Cocok untuk diskusi, brainstorming, atau ice breaker. Bisa berisi wordcloud, tanya jawab, dan polling.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="session-title">Judul Sesi</Label>
              <Input
                id="session-title"
                {...register("title", {
                  required: "Isi judul yang diinginkan...",
                })}
                className="h-11"
                type="text"
              />
              {errors.title && (
                <div className="mt-1 text-xs font-semibold text-destructive">
                  {errors.title.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="session-class-size">
                Jumlah siswa di kelas
              </Label>
              <Input
                id="session-class-size"
                {...register("class_size", {
                  required: "Jumlah siswa di kelas wajib diisi.",
                  setValueAs: (value) =>
                    value === "" || value == null
                      ? null
                      : Number(value),
                  validate: (value) =>
                    value == null ||
                    (Number.isInteger(value) && value >= 1 && value <= 500) ||
                    "Jumlah siswa harus antara 1 dan 500.",
                })}
                className="h-11"
                type="number"
                min={1}
                max={500}
                placeholder="Contoh: 30"
              />
              {errors.class_size && (
                <div className="mt-1 text-xs font-semibold text-destructive">
                  {errors.class_size.message}
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Isi jumlah siswa terdaftar di kelas. Ini dipakai untuk
                menghitung tingkat kehadiran siswa di analytics.
              </p>
            </div>

            <div className="border-t border-border" />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">
                Buat Pertanyaan Pertama
              </h2>

              <div className="flex flex-col gap-1.5">
                <Label>Tipe Soal</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Pilih type soal.." }}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      items={questionTypeItems}
                    >
                      <SelectTrigger
                        className="h-11 w-full"
                        aria-invalid={!!errors.type}
                      >
                        <SelectValue placeholder="Pilih Tipe Soal" />
                      </SelectTrigger>
                      <SelectContent
                        side="bottom"
                        sideOffset={4}
                        alignItemWithTrigger={false}
                      >
                        {selectedMode === "quiz" ? (
                          <SelectItem value="quiz">Quiz</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="wordcloud">Wordcloud</SelectItem>
                            <SelectItem value="qa">Tanya Jawab</SelectItem>
                            <SelectItem value="polling">Polling</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <div className="mt-1 text-xs font-semibold text-destructive">
                    {errors.type.message}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="session-question">Pertanyaan Anda</Label>
                <Textarea
                  id="session-question"
                  {...register("question", {
                    required: "Pertanyaan wajib diisi",
                  })}
                  className="h-32 resize-none"
                />
                {errors.question && (
                  <div className="mt-1 text-xs font-semibold text-destructive">
                    {errors.question.message}
                  </div>
                )}
              </div>

              {(selectedType === "quiz" || selectedType === "polling") && (
                <div className="flex flex-col gap-2">
                  <Label>Opsi Jawaban</Label>

                  <div className="grid w-full grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
                      >
                        <Input
                          {...register(`option.${index}.text`, {
                            required: "Opsi wajib diisi",
                          })}
                          placeholder={`Opsi ${index + 1}`}
                          className="h-9 flex-1"
                        />
                        {selectedType === "quiz" && (
                          <Input
                            type="radio"
                            value={index}
                            {...register("correctIndex", {
                              required: "Pilih jawaban yang benar...",
                            })}
                            className="h-4 w-4 shrink-0"
                            aria-label={`Jawaban benar opsi ${index + 1}`}
                          />
                        )}
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          Hapus
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          text: "",
                          is_correct: false,
                          option_order: fields.length,
                        })
                      }
                      variant="outline"
                      className="h-auto min-h-11 border-dashed w-full"
                    >
                      Tambah Opsi
                    </Button>
                  </div>
                </div>
              )}

              {(errorOpsiPertama && (
                <div className="mt-1 text-xs font-semibold text-destructive">
                  {errorOpsiPertama.message}
                </div>
              )) ||
                (selectedType === "quiz" && errors.correctIndex && (
                  <div className="mt-1 text-xs font-semibold text-destructive">
                    {errors.correctIndex.message}
                  </div>
                ))}
            </div>
            <Button
              disabled={isSubmitting}
              size="lg"
              className="mt-2 h-11 w-full"
              type="submit"
            >
              {isSubmitting ? "Membuat sesi..." : "Buat Sekarang"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default CreateSessionsPage;
