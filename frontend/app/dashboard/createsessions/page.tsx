"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { createPolls, createSession } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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
};

interface SessionFormInput {
  title: string;
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "option",
  });
  const selectedType = watch("type");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorOpsiPertama = errors.option?.[0]?.text;

  const buildOptionsPayload = (options: PollOption[], correctIndex: number) =>
    options.map((option, index) => ({
      text: option.text,
      is_correct: index === Number(correctIndex),
      option_order: index,
    }));

  const handleSubmitSession = async (formData: SessionFormInput) => {
    if (!user || !isAuthenticated) {
      setErrorMessage("Anda harus login terlebih dahulu...");
      return;
    }

    try {
      const createdSession = await createSession(formData.title, "");
      const newSessionId = createdSession?.id;

      if (!newSessionId) {
        throw new Error("Gagal mendapatkan ID Sesi dari backend");
      }

      try {
        const optionsPayload = buildOptionsPayload(
          formData.option,
          formData.correctIndex,
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
      setErrorMessage(`Gagal membuat sesi: ${error}`);
    }
  };

  return (
    <section className="flex min-h-screen flex-1 items-center justify-center bg-secondary/80 p-4 font-sans">
      <Card className="w-full max-w-2xl shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Buat Sesi & Pertanyaan
          </CardTitle>
          <CardDescription>
            Mulai sesi interaktif Anda dengan pertanyaan pertama.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="border-t border-border" />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-primary">
                Buat Pertanyaan Pertama
              </h2>

              <div className="flex flex-col gap-1.5">
                <Label>Tipe Soal</Label>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-destructive">
                    Perhatian:{" "}
                  </span>
                  Tipe soal hanya bisa dipilih sekarang dan tidak dapat diubah
                  sepanjang sesi.
                </p>
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
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="wordcloud">Wordcloud</SelectItem>
                        <SelectItem value="qa">Tanya Jawab</SelectItem>
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

              {selectedType === "quiz" && (
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
                        <Input
                          type="radio"
                          value={index}
                          {...register("correctIndex", {
                            required: "Pilih jawaban yang benar...",
                          })}
                          className="h-4 w-4 shrink-0"
                          aria-label={`Jawaban benar opsi ${index + 1}`}
                        />
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
                (errors.correctIndex && (
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
              {isSubmitting ? "Sedang memperoses..." : "Buat Sekarang"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default CreateSessionsPage;
