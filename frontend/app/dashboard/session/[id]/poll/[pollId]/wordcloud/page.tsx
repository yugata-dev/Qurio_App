"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { fetchWordcloudList } from "@/lib/api";

type WordcloudItem = { text: string; value: number };
type PositionedWord = WordcloudItem & {
  x: number; // persen (0-100) dari lebar container
  y: number; // persen (0-100) dari tinggi container
  fontSize: number; // px
  color: string;
};

// Ruang virtual untuk perhitungan tata letak (dikonversi ke % saat render)
const CANVAS_W = 1000;
const CANVAS_H = 560;

const MIN_FONT = 18;
const MAX_FONT = 56;
const PADDING = 10; // jarak minimal antar kata (px virtual)

const COLORS = ["#0f172a", "#0f766e", "#7c3aed", "#ea580c", "#be185d", "#1d4ed8"];

/** Hitung posisi semua kata: kata terbesar di tengah, sisanya spiral keluar tanpa tumpang tindih. */
function layoutWords(items: WordcloudItem[]): PositionedWord[] {
  if (!items.length) return [];

  const values = items.map((i) => i.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const result: PositionedWord[] = [];

  sorted.forEach((item, index) => {
    const norm = max === min ? 0.5 : (item.value - min) / (max - min);
    const fontSize = MIN_FONT + norm * (MAX_FONT - MIN_FONT);

    // Perkiraan ukuran kotak kata (font black ≈ 0.62em per huruf)
    const w = item.text.length * fontSize * 0.62 + PADDING * 2;
    const h = fontSize * 1.2 + PADDING;

    let angle = 0;
    for (let step = 0; step < 4000; step++) {
      const r = 3 * angle;
      const x = CANVAS_W / 2 + r * Math.cos(angle) * 1.8; // dilebarkan untuk layout landscape
      const y = CANVAS_H / 2 + r * Math.sin(angle);
      angle += 0.2;

      const inside =
        x - w / 2 >= 0 && x + w / 2 <= CANVAS_W && y - h / 2 >= 0 && y + h / 2 <= CANVAS_H;
      if (!inside) continue;

      const collide = placed.some(
        (p) => Math.abs(x - p.x) < (w + p.w) / 2 && Math.abs(y - p.y) < (h + p.h) / 2
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
    // Jika tidak ada ruang tersisa, kata dilewati.
  });

  return result;
}

export default function WordcloudPage() {
  const params = useParams();
  const pollId = params.pollId as string;
  const sessionId = params.id as string;

  const [items, setItems] = useState<WordcloudItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const data = await fetchWordcloudList(pollId);
        const list = Array.isArray(data)
          ? data
          : (data as any)?.items || (data as any)?.data || [];

        if (ignore) return;

        // Gabungkan kata yang sama (case-insensitive) dan jumlahkan nilainya
        const map = new Map<string, number>();
        (list as any[]).forEach((item: any) => {
          const t = String(item.text ?? item.word ?? item).trim().toLowerCase();
          if (!t) return;
          const v = Number(item.value ?? item.count ?? 1) || 1;
          map.set(t, (map.get(t) || 0) + v);
        });

        setItems(Array.from(map.entries()).map(([text, value]) => ({ text, value })));
      } catch (err) {
        console.error("Gagal memuat wordcloud:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    if (pollId) load();
    return () => {
      ignore = true;
    };
  }, [pollId]);

  const positionedWords = useMemo(() => layoutWords(items), [items]);
  const hiddenCount = items.length - positionedWords.length;

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 bg-white border rounded-xl p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">SESSION {sessionId}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-800">Wordcloud Response</h1>
        </div>

        {/* Rasio tetap 1000:560 supaya posisi persen selalu proporsional */}
        <div
          className="relative w-full overflow-hidden rounded-2xl border bg-white isolate"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}`, minHeight: 320 }}
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
                className="absolute font-black whitespace-nowrap select-none leading-none"
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

        {!loading && hiddenCount > 0 && (
          <p className="mt-2 text-sm text-slate-500">
            {hiddenCount} kata tidak ditampilkan karena ruang penuh.
          </p>
        )}
      </div>
    </div>
  );
}