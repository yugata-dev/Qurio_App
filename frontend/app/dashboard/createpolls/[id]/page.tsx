"use client";
import { useState, useEffect } from "react";
import { createPolls, getAllDataPolls } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useFieldArray, useForm } from "react-hook-form";
import { useParams } from "next/navigation";
import { Poll } from "../../session/[id]/page";
import { useRouter } from "next/navigation";

interface pollOption {
  option_text: string;
  option_order: number;
}

interface formPolls {
  question: string;
  option: pollOption[];
  correctIndex: string;
}

function CreatePollsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<formPolls>({
    defaultValues: {
      option: [
        { option_text: "", option_order: 0 },
        { option_text: "", option_order: 1 },
      ],
      correctIndex: "",
    },
    shouldUnregister: true,
  });
  const {fields, append, remove } = useFieldArray({
    control,
    name: "option",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const sessionId = params?.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const type = polls?.[0]?.type as string

  useEffect(() => {
    if (!token || !sessionId) return;
    if (!token) return;

    const fetchPollData = async () => {
      try {
        const pollResponse = await getAllDataPolls(sessionId, token);
        setPolls(Array.isArray(pollResponse) ? pollResponse : []);
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error ? error.message : "Gagal mengambil data poll.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPollData();
  }, [sessionId, token]);

  const onSubmitPolls = async (dataPolls: formPolls) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user || !token) {
      setErrorMessage("Anda harus login terlebih dahulu.");
      return;
    }

    try {
      await createPolls(
        type,
        dataPolls.question,
        dataPolls.option.map((option, index) => ({
          text: option.option_text,
          is_correct: index === Number(dataPolls.correctIndex),
          option_order: index,
        })),
        sessionId,
        token,
        "published",
      );

      setSuccessMessage("Soal berhasil dibuat dan dipublikasikan.");
      router.push(`/dashboard/session/${sessionId}`);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal membuat soal.",
      );
    }
  };

  const typeQuestion = polls?.[0]?.type;
  const pollType = polls?.[0]?.type === "quiz"

  if (!sessionId) return <div role="alert">ID sesi tidak ditemukan.</div>;
  if (isLoading) return <div>Memuat data poll...</div>;
  return (
    <form onSubmit={handleSubmit(onSubmitPolls)}>
      {errorMessage && (
        <div className="mb-4 text-sm font-semibold text-red-600" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div
          className="mb-4 text-sm font-semibold text-green-600"
          role="status"
        >
          {successMessage}
        </div>
      )}
      
          <p>Type Soal Saat Ini {polls?.[0]?.type}</p>
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-center">
          <p>buat soal di sesi dengan judul </p>
          Buat Pertanyaan
        </h2>

        <div className="flex flex-col gap-1"></div>

        <div className="flex flex-col gap-1">
          <label className="font-bold text-[1.2rem]">Pertanyaan Anda:</label>
          <textarea
            {...register("question", { required: "Pertanyaan wajib diisi" })}
            className="w-full text-black bg-white rounded border-2 border-black h-32 text-base outline-none py-2 px-3 resize-none font-light"
          />
          {errors.question && (
            <div className="text-xs font-semibold text-red-500">
              {errors.question.message}
            </div>
          )}
        </div>

        {typeQuestion === "quiz" && (
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[1.2rem]">Opsi Jawaban:</label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-2 border-amber-600 p-4 rounded-xl">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-2 gap-2 flex items-center border-2 border-amber-400 rounded-lg bg-white"
                >
                  <input
                    {...register(`option.${index}.option_text`, {
                      required: pollType ? "Opsi wajib diisi" : false,
                    })}
                    className="text-black bg-gray-50 flex-1 rounded p-1 border font-light"
                    placeholder={`Opsi ${index + 1}`}
                  />
                  <input
                    {...register("correctIndex", {
                      required: pollType ? "Pilih jawaban benar" : false,
                    })}
                    type="radio"
                    value={index}
                    className="w-4 h-4"
                    aria-label={`Tandai opsi ${index + 1} sebagai jawaban benar`}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 text-sm hover:underline"
                    disabled={fields.length <= 2}
                  >
                    Hapus
                  </button>
                  {typeQuestion && errors.option?.[index]?.option_text && (
                    <div className="basis-full text-xs font-semibold text-red-500">
                      {errors.option[index]?.option_text?.message}
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  append({ option_text: "", option_order: fields.length })
                }
                className="border-2 border-dashed border-amber-600 rounded-lg p-2 hover:bg-amber-100 text-amber-800 transition"
              >
                + Tambah Opsi
              </button>
            </div>
            {typeQuestion && errors.correctIndex && (
              <div className="text-xs font-semibold text-red-500">
                {errors.correctIndex.message}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        disabled={isSubmitting}
        className="bg-amber-300 text-xl font-bold rounded-xl p-3 mt-4 hover:bg-amber-400 shadow transition w-full"
        type="submit"
      >
        {isSubmitting ? "Sedang memperoses..." : "Buat Sekarang"}
      </button>
    </form>
  );
}

export default CreatePollsPage;
