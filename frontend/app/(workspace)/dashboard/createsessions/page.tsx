"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconChartBar,
  IconCircleCheck,
  IconMessages,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { createPolls, createSession } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      {/* Header halaman. */}
      <header className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-3.5" />
          Kembali ke Dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.5px] text-foreground">
          Buat Sesi Baru
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mulai kelas dengan satu pertanyaan pembuka. Setelah sesi dibuat, kamu
          bisa menambah pertanyaan lain dari halaman sesi.
        </p>
      </header>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <IconAlertTriangle />
          <AlertTitle>Gagal membuat sesi</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/5">
          <IconCircleCheck className="text-emerald-600" />
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form
        className="flex flex-col gap-6"
        onSubmit={handleSubmit(handleSubmitSession)}
      >
        {/* Panel detail sesi. */}
        <Card className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
          <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base font-semibold text-foreground">
              Detail Sesi
            </CardTitle>
            <CardDescription>
              Atur tipe, judul, dan jumlah siswa untuk sesi ini
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-5 pt-4 sm:p-6 sm:pt-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-foreground">
                Tipe Sesi
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setValue("mode", "quiz")}
                  aria-pressed={selectedMode === "quiz"}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    selectedMode === "quiz"
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      selectedMode === "quiz"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <IconChartBar className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Sesi Quiz
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      Ada nilai. Cocok untuk ujian, pre-test, atau kuis
                      penilaian. Hanya bisa berisi soal quiz.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("mode", "interactive")}
                  aria-pressed={selectedMode === "interactive"}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    selectedMode === "interactive"
                      ? "border-primary bg-primary/[0.04]"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      selectedMode === "interactive"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <IconMessages className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      Sesi Interaktif
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      Tanpa nilai. Cocok untuk diskusi, brainstorming, atau ice
                      breaker. Bisa berisi wordcloud, tanya jawab, dan polling.
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="session-title"
                className="text-sm font-medium text-foreground"
              >
                Judul Sesi
              </Label>
              <Input
                id="session-title"
                {...register("title", {
                  required: "Isi judul yang diinginkan...",
                })}
                className="h-11 rounded-xl"
                type="text"
                placeholder="Contoh: Kuis Bab 3 - Fotosintesis"
              />
              {errors.title && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="session-class-size"
                className="text-sm font-medium text-foreground"
              >
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
                className="h-11 rounded-xl"
                type="number"
                min={1}
                max={500}
                placeholder="Contoh: 30"
              />
              {errors.class_size && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {errors.class_size.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Isi jumlah siswa terdaftar di kelas. Ini dipakai untuk
                menghitung tingkat kehadiran siswa di analytics.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Panel pertanyaan pertama. */}
        <Card className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
          <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardTitle className="text-base font-semibold text-foreground">
              Pertanyaan Pertama
            </CardTitle>
            <CardDescription>
              Pertanyaan pembuka yang langsung tampil saat sesi dimulai
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-5 pt-4 sm:p-6 sm:pt-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium text-foreground">
                Tipe Soal
              </Label>
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
                      className="h-11 w-full rounded-xl"
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
                <p className="mt-1 text-xs font-medium text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="session-question"
                className="text-sm font-medium text-foreground"
              >
                Pertanyaan Anda
              </Label>
              <Textarea
                id="session-question"
                {...register("question", {
                  required: "Pertanyaan wajib diisi",
                })}
                className="min-h-28 resize-none rounded-xl"
                placeholder="Contoh: Apa organel tumbuhan yang berperan dalam fotosintesis?"
              />
              {errors.question && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {errors.question.message}
                </p>
              )}
            </div>

            {(selectedType === "quiz" || selectedType === "polling") && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Opsi Jawaban
                </Label>
                {selectedType === "quiz" && (
                  <p className="text-xs text-muted-foreground">
                    Tandai lingkaran pada opsi yang menjadi jawaban benar.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 pl-3"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <Input
                        {...register(`option.${index}.text`, {
                          required: "Opsi wajib diisi",
                        })}
                        placeholder={`Opsi ${index + 1}`}
                        className="h-9 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                      />
                      {selectedType === "quiz" && (
                        <Input
                          type="radio"
                          value={index}
                          {...register("correctIndex", {
                            required: "Pilih jawaban yang benar...",
                          })}
                          className="size-4 shrink-0 accent-primary"
                          aria-label={`Jawaban benar opsi ${index + 1}`}
                        />
                      )}
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Hapus opsi ${index + 1}`}
                        title={`Hapus opsi ${index + 1}`}
                      >
                        <IconTrash className="size-4" />
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
                    className="h-11 w-full rounded-xl border-dashed"
                  >
                    <IconPlus className="size-4" />
                    Tambah Opsi
                  </Button>
                </div>
              </div>
            )}

            {(errorOpsiPertama && (
              <p className="mt-1 text-xs font-medium text-destructive">
                {errorOpsiPertama.message}
              </p>
            )) ||
              (selectedType === "quiz" && errors.correctIndex && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {errors.correctIndex.message}
                </p>
              ))}
          </CardContent>
        </Card>

        {/* Aksi form. */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6"
            onClick={() => router.push("/dashboard")}
          >
            Batal
          </Button>
          <Button
            disabled={isSubmitting}
            size="lg"
            className="h-11 px-8"
            type="submit"
          >
            {isSubmitting ? "Membuat sesi..." : "Buat Sekarang"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default CreateSessionsPage;
