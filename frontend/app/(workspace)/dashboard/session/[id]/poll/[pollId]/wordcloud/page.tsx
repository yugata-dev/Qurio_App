"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchWordcloudList, getAllDataPolls } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WordcloudItem = { text: string; value: number };
type PositionedWord = WordcloudItem & {
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

// -------------------------------------------------------------
// Konfigurasi layout
// -------------------------------------------------------------
const CANVAS_W = 1000;
const CANVAS_H = 560;

const MIN_FONT = 18;
const MAX_FONT = 56;
const PADDING = 10;

const COLORS = [
  "#0f172a",
  "#0f766e",
  "#7c3aed",
  "#ea580c",
  "#be185d",
  "#1d4ed8",
];

// -------------------------------------------------------------
// Stopword list — kata umum yang biasanya jadi noise di wordcloud.
// Set true untuk mengaktifkan filter, false untuk mematikan.
// -------------------------------------------------------------
const ENABLE_STOPWORDS = true;

const STOPWORDS = new Set([
  // Kata umum sekolah
  "guru", "kelas", "belajar", "materi", "contoh", "penting",
  "cara", "mudah", "menarik", "proses", "kegiatan", "penjelasan",
  "siswa", "murid", "sekolah", "pelajaran", "hari", "ini",
  "itu", "yang", "dan", "atau", "juga", "saja", "sudah",
  "belum", "bisa", "tidak", "bukan", "adalah", "akan",
  // Kata sifat umum
  "bagus", "seru", "asik", "jelek", "susah", "sulit",
  "senang", "sedih", "biasa", "lumayan",
  // Kata teknis netral
  "teori", "konsep", "data", "info", "informasi",
]);

// -------------------------------------------------------------
// Layout spiral untuk wordcloud
// -------------------------------------------------------------
function layoutWords(items: WordcloudItem[]): PositionedWord[] {
  if (!items.length) return [];

  const values = items.map((i) => i.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const result: PositionedWord[] = [];

  const aspect = CANVAS_W / CANVAS_H;

  sorted.forEach((item, index) => {
    const norm = max === min ? 0.5 : (item.value - min) / (max - min);
    const fontSize = MIN_FONT + norm * (MAX_FONT - MIN_FONT);

    // Estimasi bounding box lebih konservatif
    const w = item.text.length * fontSize * 0.72 + PADDING * 2;
    const h = fontSize * 1.3 + PADDING;

    let angle = 0;
    for (let step = 0; step < 6000; step++) {
      const r = 3 * angle;
      const x = CANVAS_W / 2 + r * Math.cos(angle) * aspect;
      const y = CANVAS_H / 2 + r * Math.sin(angle);
      angle += 0.35;

      const inside =
        x - w / 2 >= 0 &&
        x + w / 2 <= CANVAS_W &&
        y - h / 2 >= 0 &&
        y + h / 2 <= CANVAS_H;
      if (!inside) continue;

      const collide = placed.some(
        (p) =>
          Math.abs(x - p.x) < (w + p.w) / 2 &&
          Math.abs(y - p.y) < (h + p.h) / 2,
      );
      if (collide) continue;

      placed.push({ x, y, w, h });
      result.push({
        ...item,
        x: (x / CANVAS_W) * 100,
        y: (y / CANVAS_H) * 100,
        fontSize,
        color: COLORS[index % COLORS.length],
      });
      break;
    }
  });

  return result;
}

// -------------------------------------------------------------
// Halaman
// -------------------------------------------------------------
export default function WordcloudPage() {
  const params = useParams();
  const pollId = params.pollId as string;
  const sessionId = params.id as string;

  const [rawItems, setRawItems] = useState<WordcloudItem[]>([]);
  const [questionText, setQuestionText] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // Fetch data: poll detail + daftar kata
  // -------------------------------------------------------------
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const [allPolls, wordcloudData] = await Promise.all([
          getAllDataPolls(sessionId, null).catch((err) => {
            console.error("Gagal memuat daftar poll:", err);
            return [];
          }),
          fetchWordcloudList(pollId).catch((err) => {
            console.error("Gagal memuat wordcloud:", err);
            return [];
          }),
        ]);

        if (ignore) return;

        const matchedPoll = (
          allPolls as Array<{
            id?: string;
            question?: string;
            status?: string;
          }>
        ).find((poll) => poll.id === pollId);

        if (matchedPoll) {
          setQuestionText(matchedPoll.question ?? null);
          setPollStatus(matchedPoll.status ?? null);
        }

        const rawList = Array.isArray(wordcloudData)
          ? wordcloudData
          : (wordcloudData as { items?: unknown[]; data?: unknown[] } | null)
            ?.items ??
          (wordcloudData as { items?: unknown[]; data?: unknown[] } | null)
            ?.data ??
          [];

        const map = new Map<string, number>();
        (rawList as unknown[]).forEach((entry) => {
          const item =
            typeof entry === "object" && entry !== null
              ? (entry as Record<string, unknown>)
              : {};
          const textValue = item.text ?? item.word ?? entry;
          const t = String(textValue).trim().toLowerCase();
          if (!t) return;

          const v = Number(item.value ?? item.count ?? 1) || 1;
          map.set(t, (map.get(t) || 0) + v);
        });

        setRawItems(
          Array.from(map.entries()).map(([text, value]) => ({ text, value })),
        );
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (pollId && sessionId) load();
    return () => {
      ignore = true;
    };
  }, [pollId, sessionId]);

  // -------------------------------------------------------------
  // Filter stopwords (kalau diaktifkan)
  // -------------------------------------------------------------
  const items = useMemo(() => {
    if (!ENABLE_STOPWORDS) return rawItems;

    const filtered = rawItems.filter(
      (item) => !STOPWORDS.has(item.text.toLowerCase()),
    );

    // Kalau filter bikin data kosong (semua kata terfilter),
    // fallback ke raw items supaya halaman tidak kosong.
    return filtered.length > 0 ? filtered : rawItems;
  }, [rawItems]);

  const filteredCount = rawItems.length - items.length;

  // -------------------------------------------------------------
  // Turunan data untuk kartu insight
  // -------------------------------------------------------------
  const positionedWords = useMemo(() => layoutWords(items), [items]);
  const hiddenCount = items.length - positionedWords.length;

  const totalResponses = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items],
  );

  const uniqueWords = items.length;

  const topWords = useMemo(
    () => [...items].sort((a, b) => b.value - a.value).slice(0, 3),
    [items],
  );

  const rareWords = useMemo(
    () => items.filter((item) => item.value === 1).slice(0, 6),
    [items],
  );

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header + soal */}
        <div className="mb-4 rounded-xl border bg-white p-5">
          <h1 className="mt-2 text-3xl font-black text-slate-800">
            Wordcloud Response
          </h1>

          {questionText && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pertanyaan
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-700">
                {questionText}
              </p>
              {pollStatus && (
                <p className="mt-1 text-xs text-slate-500">
                  Status:{" "}
                  {pollStatus === "published"
                    ? "Sedang berjalan"
                    : pollStatus === "closed"
                      ? "Selesai"
                      : "Draft"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Wordcloud visual */}
        <div
          className="isolate relative w-full overflow-hidden rounded-2xl border bg-white"
          style={{
            aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            minHeight: 320,
          }}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              Loading...
            </div>
          ) : positionedWords.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              Belum ada jawaban.
            </div>
          ) : (
            positionedWords.map((word) => (
              <span
                key={word.text}
                title={`${word.text} (${word.value})`}
                className="absolute select-none whitespace-nowrap font-black leading-none"
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${word.fontSize}px`,
                  color: word.color,
                }}
              >
                {word.text}
              </span>
            ))
          )}
        </div>

        {/* Info footer kecil */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {!loading && hiddenCount > 0 && (
            <span>
              {hiddenCount} kata tidak ditampilkan karena ruang penuh.
            </span>
          )}
          {!loading && ENABLE_STOPWORDS && filteredCount > 0 && (
            <span>
              {filteredCount} kata umum disembunyikan (mis. &quot;guru&quot;,
              &quot;kelas&quot;).
            </span>
          )}
        </div>

        {/* Kartu insight */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {/* Kartu 1: Top 3 kata dominan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kata Paling Sering</CardTitle>
            </CardHeader>
            <CardContent>
              {topWords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Belum ada data
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {topWords.map((word, index) => (
                    <li
                      key={word.text}
                      className="flex items-baseline justify-between gap-2"
                    >
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {word.text}
                        </span>
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {word.value}x
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Kartu 2: Statistik respons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ringkasan Respons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalResponses}</p>
              <p className="text-xs text-muted-foreground">
                Total jawaban dari {uniqueWords} kata unik
              </p>
            </CardContent>
          </Card>

          {/* Kartu 3: Kata langka (muncul 1x) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Kata Langka</CardTitle>
            </CardHeader>
            <CardContent>
              {rareWords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada kata yang muncul hanya sekali.
                </p>
              ) : (
                <>
                  <ul className="flex flex-wrap gap-1.5">
                    {rareWords.map((word) => (
                      <li
                        key={word.text}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {word.text}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Muncul sekali — mungkin ide unik dari siswa
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}