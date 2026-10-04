"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import {
  IconArrowRight,
  IconBolt,
  IconChartBar,
  IconCheck,
  IconCheckbox,
  IconChevronDown,
  IconCircleCheck,
  IconDeviceMobile,
  IconFileDownload,
  IconLayoutGrid,
  IconList,
  IconMessageQuestion,
  IconMenu2,
  IconShieldCheck,
  IconTrendingUp,
  IconTrophy,
  IconUserPlus,
  IconUsers,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { AccessForm } from "@/components/AccessForm";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Gaya chip melayang: rotasi tetap (--rot) + animasi float (keyframes ada di <style> di hero)
const floatStyle = (rot: number, duration: number, delay = 0): CSSProperties =>
  ({
    "--rot": `${rot}deg`,
    transform: `rotate(${rot}deg)`,
    animation: `float ${duration}s ease-in-out ${delay}s infinite`,
  }) as CSSProperties;

function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto mb-14 max-w-2xl text-center", className)}>
      <span className="mb-4 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-[0.12em] text-brand-700">
        {eyebrow}
      </span>
      <h2 className="m-0 text-balance text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const featureCards: [Icon, string, string][] = [
  [
    IconChartBar,
    "Dua Mode Sesi",
    "Pilih Sesi Quiz untuk penilaian, atau Sesi Interaktif untuk diskusi, brainstorming, dan ice breaker.",
  ],
  [
    IconBolt,
    "Real-time WebSocket",
    "Respons siswa muncul otomatis di layar guru tanpa refresh, dengan latensi di bawah 0,2 detik.",
  ],
  [
    IconTrendingUp,
    "Analitik Kelas Lengkap",
    "Skor rata-rata, tingkat kehadiran, topik tersulit, dan peringkat siswa dalam satu dashboard.",
  ],
  [
    IconFileDownload,
    "Ekspor CSV & PDF",
    "Unduh laporan lengkap dalam format CSV untuk analisis Excel, atau PDF untuk arsip dan rapor.",
  ],
];

const trustPoints: [Icon, string, string][] = [
  [
    IconDeviceMobile,
    "Tanpa unduh aplikasi",
    "Siswa cukup membuka tautan dari HP atau laptop apa pun.",
  ],
  [
    IconShieldCheck,
    "Data siswa seminimal mungkin",
    "Siswa tidak perlu membuat akun. Cukup kode kelas, nama, dan nomor absen.",
  ],
  [
    IconUsers,
    "Dirancang untuk ruang kelas nyata",
    "Dari kelas kecil sampai ruang penuh, semua suara tetap terbaca.",
  ],
];

const teacherBenefits = [
  "Gratis tanpa kartu kredit",
  "Tanpa unduh aplikasi",
  "Sesi pertama siap dalam 1 menit",
];

const steps: [string, string, string][] = [
  ["1", "Guru Membuat Sesi", "Siapkan pertanyaan dan pilih mode interaksi."],
  [
    "2",
    "Siswa Memasukkan Kode",
    "Siswa bergabung dengan 6 digit kode tanpa login.",
  ],
  [
    "3",
    "Qurio Membaca Pola",
    "Lihat insight, rekomendasi, dan hasil secara instan.",
  ],
];

const faqs: [string, string][] = [
  [
    "Apakah siswa harus mengunduh aplikasi atau membuat akun?",
    "Tidak. Siswa bergabung lewat browser dengan memasukkan kode kelas, nama, dan nomor absen. Tidak ada aplikasi yang perlu diunduh dan tidak ada akun yang perlu dibuat.",
  ],
  [
    "Apa bedanya Sesi Quiz dan Sesi Interaktif?",
    "Sesi Quiz dipakai untuk penilaian dengan skor dan peringkat. Sesi Interaktif dipakai untuk diskusi, brainstorming, dan ice breaker lewat word cloud, Q&A, dan polling.",
  ],
  [
    "Seberapa cepat respons siswa muncul di layar guru?",
    "Respons muncul otomatis lewat koneksi real-time tanpa perlu menyegarkan halaman, dengan latensi di bawah 0,2 detik.",
  ],
  [
    "Bisakah saya menyimpan hasil kelas untuk arsip atau rapor?",
    "Bisa. Laporan sesi dapat diekspor dalam format CSV untuk dianalisis di Excel, atau PDF untuk arsip dan rapor.",
  ],
  [
    "Apakah Qurio gratis?",
    "Anda bisa mendaftar tanpa kartu kredit dan membuat sesi pertama dalam sekitar satu menit.",
  ],
];

const marqueeItems = [
  "Qurio: Transparansi Intelektual Murid",
  "Tanpa Download Aplikasi & Tanpa Login Siswa",
  "Real-time WebSocket, Respons di Bawah 0,2 Detik",
  "Quiz, Word Cloud, Q&A, Polling dalam Satu Platform",
  "Dua Mode: Sesi Quiz & Sesi Interaktif",
  "Transparansi Data Kelas untuk Keputusan Mengajar",
];

const footerLinks = [
  ["Fitur", "#features"],
  ["Cara Kerja", "#modes"],
  ["FAQ", "#faq"],
  ["Untuk Guru", "#daftar-guru"],
] as const;

type PreviewTab = "quiz" | "interactive";

function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("quiz");

  const selectTab = (tab: PreviewTab) => {
    setActiveTab(tab);
    document.getElementById(`preview-tab-${tab}`)?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectTab(activeTab === "quiz" ? "interactive" : "quiz");
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab("quiz");
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab("interactive");
    }
  };

  const stats = activeTab === "quiz"
    ? [
        ["Total Siswa", "24", "Siswa yang ikut sesi"],
        ["Rata-rata Skor Kuis", "78%", "Dari jawaban yang dinilai"],
        ["Tingkat Kehadiran", "92%", "Rata-rata per sesi"],
        ["Sesi Dianalisis", "8", "Sesi mode Quiz"],
      ]
    : [
        ["Total Sesi Interaktif", "6", "Sesi tanpa penilaian"],
        ["Total Partisipasi", "124", "Kehadiran di seluruh sesi"],
        ["Rata-rata Peserta", "21", "Siswa per sesi"],
        ["Aktivitas Digunakan", "—", "Segera hadir (Word Cloud, Q&A, Polling)"],
      ];

  return (
    <div className="mt-14 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_4px_rgba(15,23,42,0.04),0_32px_64px_-24px_rgba(59,91,255,0.2)] sm:mt-16">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-secondary/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-rose-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
          Contoh tampilan · Data simulasi
        </span>
      </div>

      <div className="grid md:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-slate-50/70 p-4 md:block">
          <Image
            src="/Qurio-Cropped.svg"
            alt="Qurio"
            width={78}
            height={37}
            className="mb-6 h-8 w-auto object-contain object-left"
          />
          <span className="mb-5 flex min-h-10 items-center justify-center rounded-lg bg-brand-500 px-2 text-xs font-semibold text-white">
            + Buat Sesi Baru
          </span>
          <p className="mb-2 px-2 text-xs font-semibold text-slate-500">Workspace</p>
          <div className="space-y-1 text-xs font-medium text-slate-600">
            <span className="flex min-h-9 items-center gap-2 rounded-lg px-2.5"><IconLayoutGrid className="size-4" />Dashboard</span>
            <span className="flex min-h-9 items-center gap-2 rounded-lg px-2.5"><IconList className="size-4" />Session List</span>
            <span className="flex min-h-9 items-center gap-2 rounded-lg bg-brand-500 px-2.5 font-semibold text-white"><IconTrendingUp className="size-4" />Analytics</span>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="m-0 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Analitik Kelas</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Pantau pemahaman dan keaktifan siswa di seluruh sesi kelas Anda</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Aksi contoh">
              <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground">Muat ulang</span>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground">Ekspor CSV</span>
              <span className="inline-flex min-h-9 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground">Ekspor PDF</span>
            </div>
          </div>

          <div className="mt-5 flex border-b border-border" role="tablist" aria-label="Contoh tab analitik">
            {([
              ["quiz", "Performa Quiz"],
              ["interactive", "Engagement Interaktif"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                id={`preview-tab-${tab}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls="preview-tabpanel"
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={handleTabKeyDown}
                className={cn(
                  "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:px-4 sm:text-sm",
                  activeTab === tab
                    ? "border-brand-500 text-brand-800"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div id="preview-tabpanel" role="tabpanel" aria-labelledby={`preview-tab-${activeTab}`} tabIndex={0} className="relative max-h-[620px] overflow-hidden pt-4 outline-none">
            <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4 sm:gap-3">
              {stats.map(([label, value, detail]) => (
                <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-3 sm:rounded-2xl sm:p-4">
                  <p className="m-0 min-h-8 text-xs font-medium leading-snug text-muted-foreground sm:min-h-0">{label}</p>
                  <p className="m-0 mt-1.5 text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">{value}</p>
                  <p className="m-0 mt-1 hidden text-xs text-muted-foreground sm:block">{detail}</p>
                </div>
              ))}
            </div>

            {activeTab === "quiz" ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                  <h4 className="m-0 text-sm font-bold text-foreground">Ringkasan Kelas</h4>
                  <p className="m-0 mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">Kehadiran contoh berada di 92%. Skor rata-rata kuis 78%; Fotosintesis menjadi topik dengan persentase jawaban salah tertinggi.</p>
                </section>
                <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                  <h4 className="m-0 text-sm font-bold text-foreground">Kehadiran per Sesi</h4>
                  <div className="mt-3 space-y-3">
                    {[["Fotosintesis", 92], ["Tata Surya", 81], ["Energi", 62]].map(([name, pct]) => (
                      <div key={name}>
                        <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate font-medium">{name}</span><span className="tabular-nums text-muted-foreground">{pct}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", Number(pct) >= 80 ? "bg-emerald-500" : Number(pct) >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl border border-border bg-background p-4 sm:col-span-2 sm:p-5">
                  <h4 className="m-0 text-sm font-bold text-foreground">Topik Paling Sulit</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[["Fotosintesis", 68], ["Sistem Pernapasan", 54], ["Tata Surya", 41]].map(([name, pct]) => (
                      <div key={name} className="min-w-0 rounded-xl bg-muted/50 p-3">
                        <div className="mb-2 flex justify-between gap-2 text-xs"><span className="truncate font-medium">{name}</span><span className={cn("font-bold tabular-nums", Number(pct) >= 60 ? "text-rose-700" : "text-amber-700")}>{pct}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-background"><div className={cn("h-full rounded-full", Number(pct) >= 60 ? "bg-rose-500" : "bg-amber-500")} style={{ width: `${pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[["Word Cloud", "42 kata"], ["Tanya Jawab", "14 pertanyaan"], ["Polling", "32 suara"]].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 sm:p-4">
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="m-0 text-sm font-bold text-foreground">Siswa Paling Aktif</h4>
                      <p className="m-0 mt-1 text-xs text-muted-foreground">Contoh aktivitas dari sesi interaktif</p>
                    </div>
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800">3 aktivitas</span>
                  </div>
                  <div className="mt-3 divide-y divide-border">
                    {[["A", "Alya Putri", "12 aktivitas", "Sangat Aktif"], ["B", "Bima Pratama", "8 aktivitas", "Aktif"], ["C", "Citra Nabila", "6 aktivitas", "Aktif"]].map(([initial, name, count, status]) => (
                      <div key={name} className="flex items-center gap-3 py-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">{initial}</span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{name}</span>
                        <span className="hidden text-xs text-muted-foreground sm:inline">{count}</span>
                        <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", status === "Sangat Aktif" ? "bg-emerald-50 text-emerald-800" : "bg-brand-50 text-brand-800")}>{status}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main id="top">
      {/* ============================ NAVBAR ============================ */}
      <header className="sticky top-0 z-40 h-16 border-b border-border/70 bg-background/90 backdrop-blur-xl sm:h-20">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <a
            className="logo inline-flex shrink-0 items-center"
            href="#top"
            aria-label="Qurio beranda"
          >
            <Image
              src="/Qurio-Cropped.svg"
              alt="Qurio"
              width={100}
              height={48}
              priority
              draggable={false}
            />
          </a>
          <nav
            aria-label="Navigasi utama"
            className="hidden md:mx-auto md:flex md:items-center md:gap-9 md:text-sm md:font-semibold md:text-muted-foreground [&_a]:rounded-md [&_a]:py-2 [&_a]:transition-colors [&_a]:duration-200 [&_a:hover]:text-brand-700 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-brand-500"
          >
            <a href="#features">Fitur</a>
            <a href="#modes">Cara Kerja</a>
            <a href="#faq">FAQ</a>
            <a href="#daftar-guru">Untuk Guru</a>
          </nav>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 md:hidden"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold text-foreground transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:px-3"
              href="/login"
            >
              <span>Masuk</span>
            </Link>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-brand-500 px-2.5 py-2.5 text-xs font-bold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_6px_16px_-6px_rgba(59,91,255,0.55)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-[0_10px_24px_-8px_rgba(59,91,255,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-4 sm:text-sm"
              href="/register"
            >
              <span>Daftar Gratis</span>
            </Link>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav
            id="mobile-main-navigation"
            aria-label="Navigasi utama"
            className="absolute inset-x-0 top-full border-b border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden"
          >
            {[["Fitur", "#features"], ["Cara Kerja", "#modes"], ["FAQ", "#faq"], ["Untuk Guru", "#daftar-guru"]].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <div className="flex min-h-[calc(100svh-4rem)] flex-col sm:min-h-[calc(100svh-5rem)]">
      {/* ============================== HERO ============================ */}
      <section
        className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden bg-background py-6 sm:py-8"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        {/* Fade agar titik-titik hilang halus di tepi atas & bawah */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        {/* Glow biru lembut di belakang headline */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
            50% { transform: translateY(-6px) rotate(var(--rot, 0deg)); }
          }
          @media (prefers-reduced-motion: reduce) {
            .qurio-float { animation: none !important; }
          }
        `}</style>

        {/* 6 chip contoh hasil siswa, hanya desktop */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          aria-hidden="true"
        >
          {/* 1 - Word Cloud */}
          <div
            className="qurio-float absolute top-[12%] left-[5%] rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.45)]"
            style={floatStyle(-4, 5)}
          >
            <p className="text-xl font-bold leading-tight text-emerald-800">
              Fotosintesis
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">dari 24 siswa</p>
          </div>

          {/* 2 - Q&A */}
          <div
            className="qurio-float absolute top-[16%] right-[5%] max-w-[230px] rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(147,51,234,0.4)]"
            style={floatStyle(3, 6, 0.5)}
          >
            <div className="flex items-start gap-2">
              <IconMessageQuestion className="mt-0.5 size-4 shrink-0 text-purple-700" />
              <div>
                <p className="text-sm font-semibold leading-tight text-purple-900">
                  Kenapa daun hijau?
                </p>
                <p className="mt-1 text-xs text-purple-700">
                  18 upvote · Dijawab
                </p>
              </div>
            </div>
          </div>

          {/* 3 - Quiz */}
          <div
            className="qurio-float absolute bottom-[20%] left-[8%] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(59,130,246,0.45)]"
            style={floatStyle(2, 5.5, 1)}
          >
            <div className="flex items-center gap-2">
              <IconCircleCheck className="size-4 text-blue-700" />
              <div>
                <p className="text-sm font-bold text-blue-900">Mars</p>
                <p className="text-xs text-blue-700">78% benar</p>
              </div>
            </div>
          </div>

          {/* 4 - Polling */}
          <div
            className="qurio-float absolute bottom-[16%] right-[8%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(245,158,11,0.45)]"
            style={floatStyle(-3, 6.5, 1.5)}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <IconCheckbox className="size-4 text-amber-700" />
              <p className="text-xs font-semibold text-amber-900">Jakarta</p>
              <span className="text-xs font-bold text-amber-800">48%</span>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-amber-200/70">
              <div className="h-full w-[48%] rounded-full bg-amber-500" />
            </div>
          </div>

          {/* 5 - Siswa */}
          <div
            className="qurio-float absolute top-[42%] left-[3%] rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(244,63,94,0.4)]"
            style={floatStyle(5, 5.2, 0.8)}
          >
            <div className="flex items-center gap-2">
              <IconTrophy className="size-4 text-rose-700" />
              <div>
                <p className="text-xs font-bold text-rose-900">
                  Vina Oktaviani
                </p>
                <p className="text-xs text-rose-700">Konsisten 7 kuis</p>
              </div>
            </div>
          </div>

          {/* 6 - Status live */}
          <div
            className="qurio-float absolute top-[40%] right-[3%] rounded-2xl border border-border bg-background px-4 py-3 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.25)]"
            style={floatStyle(-2, 4.8, 1.2)}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-foreground">
                24 siswa di kelas
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1180px] px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
              <span className="size-1.5 rounded-full bg-primary" />
              Platform analitik kelas untuk guru
            </span>

            <h1 className="m-0 text-balance text-[clamp(34px,4.4vw,56px)] font-bold leading-[1.05] tracking-[-0.04em] text-foreground">
              <span className="block">Transparansi</span>
              <span className="block whitespace-nowrap">
                <span className="relative inline-block text-brand-700 after:absolute after:inset-x-0 after:bottom-[0.04em] after:-z-10 after:h-[0.14em] after:rounded-full after:bg-brand-200/80">
                  Intelektual
                </span>{" "}
                Murid
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-[1.65] text-muted-foreground sm:text-lg">
              Qurio membuat pemahaman setiap murid terlihat jelas: siapa yang
              paham, siapa yang tertinggal, dan topik mana yang sulit, langsung
              dari kuis, word cloud, Q&amp;A, dan polling real-time.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-7 sm:gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_-8px_rgba(59,91,255,0.6)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Buat Sesi Gratis
                <IconArrowRight className="size-4" />
              </Link>
              <a
                href="#modes"
                className="inline-flex min-h-12 items-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-brand-700 shadow-sm transition-colors duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                Lihat Cara Kerja
              </a>
            </div>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground sm:mt-6 sm:text-sm">
              {teacherBenefits.map((benefit) => (
                <li key={benefit} className="inline-flex items-center gap-1.5">
                  <IconCheck className="size-4 text-emerald-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile: chip ringkas, scroll horizontal */}
          <div className="mt-5 flex gap-3 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-6">
            <div className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <p className="text-sm font-bold text-emerald-800">Fotosintesis</p>
              <p className="text-xs text-emerald-700">dari 24 siswa</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-2.5">
              <p className="text-sm font-semibold text-purple-900">
                Kenapa daun hijau?
              </p>
              <p className="text-xs text-purple-700">18 upvote · Dijawab</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5">
              <p className="text-sm font-bold text-blue-900">Mars</p>
              <p className="text-xs text-blue-700">78% benar</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
              <p className="text-sm font-semibold text-amber-900">
                Jakarta · 48%
              </p>
              <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-amber-200/70">
                <div className="h-full w-[48%] rounded-full bg-amber-500" />
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5">
              <p className="text-sm font-bold text-rose-900">Vina Oktaviani</p>
              <p className="text-xs text-rose-700">Konsisten 7 kuis</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-border bg-background px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                24 siswa di kelas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE =========================== */}
      <section
        className="marquee-mask group w-full overflow-hidden border-y border-border bg-secondary"
        aria-label="Keunggulan utama Qurio"
      >
        <div className="marquee-track flex animate-marquee-scroll transition-none group-hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]">
          {[false, true].map((hidden) => (
            <div
              key={String(hidden)}
              className="marquee-group flex items-center gap-8 px-6 py-3.5 whitespace-nowrap text-xs font-bold uppercase tracking-wide text-secondary-foreground sm:gap-12 sm:py-4 sm:text-sm"
              aria-hidden={hidden || undefined}
            >
              {marqueeItems.map((item, i) => (
                <span key={item} className="inline-flex items-center gap-8 sm:gap-12">
                  {item}
                  {i < marqueeItems.length - 1 && (
                    <span className="size-1 rounded-full bg-brand-500/50" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* ======================= AKSES SISWA (CTA) ====================== */}
      <section id="cta" className="bg-audience-section py-20 sm:py-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 text-center lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:text-left">
          <div className="flex max-w-xl flex-col items-center lg:items-start">
            <span className="mb-4 inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-[0.12em] text-brand-700">
              UNTUK SISWA
            </span>
            <h2 className="m-0 mb-4 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Sudah punya kode kelas?
            </h2>
            <p className="m-0 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Masukkan kode akses, nama, dan nomor absen untuk langsung masuk
              ke ruang kelas. Tanpa akun, tanpa aplikasi.
            </p>
          </div>
          <div className="flex w-full justify-center lg:justify-end">
            <AccessForm />
          </div>
        </div>
      </section>

      {/* ============================ FITUR ============================= */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeading
            eyebrow="TRANSPARANSI INTELEKTUAL"
            title="Setiap respons adalah cermin pemahaman."
            description="Jadikan data kelas sebagai dasar keputusan belajar yang tepat sasaran."
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(([Icon, title, copy]) => (
              <article key={title} className="h-full">
                <Card className="group h-full gap-0 border-border bg-card p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_40px_-16px_rgba(59,91,255,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-brand-50 text-primary ring-1 ring-brand-100 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white group-hover:ring-brand-500">
                    <Icon className="size-7" />
                  </span>
                  <CardHeader className="p-0">
                    <CardTitle className="mb-3 mt-0 text-xl font-bold tracking-tight">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 text-[15px] leading-relaxed text-muted-foreground">
                    {copy}
                  </CardContent>
                </Card>
              </article>
            ))}
          </div>

          <DashboardPreview />

          {/* Poin kepercayaan */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {trustPoints.map(([Icon, title, copy]) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="m-0 text-sm font-bold text-foreground">
                    {title}
                  </p>
                  <p className="m-0 mt-1 text-sm leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== 4 INTERAKSI UTAMA ===================== */}
      <section id="modes" className="bg-muted py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeading
            eyebrow="4 INTERAKSI UTAMA"
            title="Interaksi yang membuat kelas hidup."
            description="Bangun sinyal pemahaman dari setiap suara di kelas."
          />

          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* Word Cloud */}
            <Card className="h-full gap-0 border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] sm:p-7">
              <span className="mb-5 block text-xs font-extrabold tracking-[0.12em] text-primary">
                01
              </span>
              <CardContent className="flex flex-1 flex-col p-0">
                <h3 className="m-0 mb-3 text-[22px] font-bold tracking-tight">
                  Word Cloud
                </h3>
                <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                  Curah pendapat live yang memetakan kata dan pola pikir
                  kelas.
                </p>
                <div className="mt-auto flex min-h-40 flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-2xl bg-muted/60 p-4 pt-5">
                  <b className="text-[34px] leading-none text-brand-purple">
                    Konsep
                  </b>
                  <em className="text-[26px] not-italic text-indigo-500">
                    Seru
                  </em>
                  <strong className="text-lg text-emerald-600">
                    Eksperimen
                  </strong>
                  <span className="text-[15px] text-slate-500">Berani</span>
                  <i className="text-xl not-italic text-teal-600">Ide</i>
                  <small className="text-sm text-slate-400">Diskusi</small>
                </div>
              </CardContent>
            </Card>

            {/* Q&A */}
            <Card className="h-full gap-0 border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] sm:p-7">
              <span className="mb-5 block text-xs font-extrabold tracking-[0.12em] text-primary">
                02
              </span>
              <CardContent className="flex flex-1 flex-col p-0">
                <h3 className="m-0 mb-3 text-[22px] font-bold tracking-tight">
                  Tanya Jawab (Q&amp;A)
                </h3>
                <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                  Papan diskusi termoderasi agar semua pertanyaan terdengar.
                </p>

                <div className="mt-auto space-y-3 pt-4">
                {[
                  ["AJ", "Bisakah dijelaskan lagi?", "18 upvote · Direkomendasikan"],
                  ["RN", "Contoh di kehidupan nyata?", "9 upvote · Menunggu moderasi"],
                ].map(([initials, question, meta]) => (
                  <div
                    key={initials}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                  >
                    <span className="grid size-10 flex-none place-items-center rounded-full bg-secondary text-sm font-extrabold text-primary">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <b className="block text-sm font-semibold text-foreground">
                        {question}
                      </b>
                      <small className="mt-0.5 block text-xs text-muted-foreground">
                        {meta}
                      </small>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>

            {/* Quiz */}
            <Card className="h-full gap-0 border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] sm:p-7">
              <span className="mb-5 block text-xs font-extrabold tracking-[0.12em] text-primary">
                03
              </span>
              <CardContent className="flex flex-1 flex-col p-0">
                <h3 className="m-0 mb-3 text-[22px] font-bold tracking-tight">
                  Kuis (Quiz)
                </h3>
                <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                  Evaluasi kognitif interaktif dengan leaderboard instan.
                </p>
                <div className="mt-auto rounded-2xl bg-muted/60 p-4 pt-5">
                  <b className="mb-3 block text-sm text-foreground">
                    Planet Merah?
                  </b>

                  <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-background p-2.5 text-sm text-muted-foreground">
                    <i className="grid size-7 place-items-center rounded-md bg-secondary text-xs font-extrabold not-italic text-muted-foreground">
                      A
                    </i>
                    <span>Venus</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-primary bg-brand-50 p-2.5 text-sm font-semibold text-primary">
                    <i className="grid size-7 place-items-center rounded-md bg-primary text-xs font-extrabold not-italic text-primary-foreground">
                      B
                    </i>
                    <span>Mars</span>
                    <strong className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
                      <IconCircleCheck className="size-4" />
                      #1
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Polling */}
            <Card className="h-full gap-0 border-border bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)] sm:p-7">
              <span className="mb-5 block text-xs font-extrabold tracking-[0.12em] text-primary">04</span>
              <CardContent className="flex flex-1 flex-col p-0">
                <h3 className="m-0 mb-3 text-[22px] font-bold tracking-tight">Polling</h3>
                <p className="m-0 min-h-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                  Ambil suara kelas dalam hitungan detik dan lihat hasilnya langsung.
                </p>
                <div className="mt-auto rounded-2xl bg-muted/60 p-4 pt-5">
                  <p className="m-0 mb-4 text-sm font-semibold leading-snug text-foreground">Kota mana yang ingin kamu kunjungi?</p>
                  <div className="space-y-3">
                    {[["Jakarta", 48], ["Bandung", 32], ["Yogyakarta", 20]].map(([city, percent]) => (
                      <div key={city}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-foreground">{city}</span>
                          <span className="font-bold tabular-nums text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-background">
                          <div className={cn("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", city === "Jakarta" ? "bg-brand-500" : "bg-brand-300")} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================== 3 LANGKAH ========================== */}
      <section className="bg-background py-20 text-foreground sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeading
            eyebrow="MULAI DALAM HITUNGAN DETIK"
            title="Mulai Live dalam 3 Langkah Mudah"
            description="Dari nol hingga analitik kelas aktif. Tidak perlu keahlian teknis."
          />

          <div className="relative">
            {/* Garis penghubung antar langkah (desktop) */}
            <div
              className="pointer-events-none absolute top-[4.5rem] z-0 hidden h-px border-t-2 border-dashed border-brand-200 md:block"
              style={{
                left: "calc((100% - 6rem) / 6)",
                right: "calc((100% - 6rem) / 6)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
              {steps.map(([num, title, copy]) => (
                <Card
                  key={num}
                  className="relative gap-0 rounded-3xl border-border px-8 py-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.18)]"
                >
                  <span className="mx-auto mb-7 grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-[0_10px_24px_-8px_rgba(59,91,255,0.55)]">
                    {num}
                  </span>
                  <h3 className="m-0 mb-2 text-xl font-bold tracking-tight">
                    {title}
                  </h3>
                  <p className="m-0 text-[15px] leading-relaxed text-muted-foreground">
                    {copy}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== FAQ ============================= */}
      <section id="faq" className="bg-muted py-20 sm:py-28">
        <div className="mx-auto w-full max-w-3xl px-6">
          <SectionHeading
            eyebrow="PERTANYAAN UMUM"
            title="Hal yang sering ditanyakan guru."
          />
          <div className="space-y-3">
            {faqs.map(([question, answer]) => (
              <details
                key={question}
                className="group rounded-2xl border border-border bg-card px-5 shadow-sm transition-colors open:border-brand-200 open:shadow-md"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold text-foreground marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
                  {question}
                  <IconChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <p className="m-0 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========================== CTA UNTUK GURU ====================== */}
      <section id="daftar-guru" className="bg-audience-section py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 text-center shadow-[0_32px_64px_-24px_rgba(59,91,255,0.55)] sm:px-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:text-left">
            <div
              className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative flex max-w-xl flex-col items-center lg:items-start">
              <span className="mb-4 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-[0.12em] text-white">
                UNTUK GURU
              </span>
              <h2 className="m-0 mb-4 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
                Siap memahami perkembangan kelas dengan lebih jelas?
              </h2>
              <p className="m-0 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                Daftarkan akun guru, siapkan pertanyaan pertama, lalu pantau
                pemahaman dan keaktifan murid Anda secara langsung.
              </p>
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold text-white lg:justify-start">
                {teacherBenefits.map((benefit) => (
                  <li key={benefit} className="inline-flex items-center gap-2">
                    <IconCheck className="size-4 text-white" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-10 flex w-full flex-col items-center gap-4 lg:mt-0 lg:items-end">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-white px-7 py-4 text-base font-extrabold text-brand-700 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span>Daftar Sekarang</span>
                <IconUserPlus className="size-5" />
              </Link>
              <span className="text-sm text-white/85">
                Sudah punya akun guru?{" "}
                <Link
                  href="/login"
                  className="font-extrabold text-white underline underline-offset-4 hover:no-underline"
                >
                  Masuk di sini
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================= FOOTER =========================== */}
      <footer className="border-t border-border bg-secondary pt-12 pb-7 sm:pt-16 sm:pb-9">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="max-w-sm">
            <a
              className="inline-flex h-11 w-24 items-center"
              href="#top"
              aria-label="Qurio beranda"
            >
              <Image
                src="/Qurio-Cropped.svg"
                alt="Qurio"
                width={100}
                height={48}
                className="h-auto w-24"
                draggable={false}
              />
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Platform analitik kelas yang membantu guru memahami setiap suara
              dan pola belajar.
            </p>
          </div>

          <nav aria-label="Navigasi footer" className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-1 sm:justify-items-start">
            <h2 className="col-span-2 m-0 text-sm font-bold text-foreground sm:col-span-1">Jelajahi Qurio</h2>
            {footerLinks.map(([label, href]) => (
              <a href={href} key={href} className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-2 border-t border-border px-6 pt-5 text-xs text-muted-foreground sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <span>© 2026 Qurio. Hak cipta dilindungi undang-undang.</span>
          <a href="#top" className="min-h-11 inline-flex items-center hover:text-foreground">Kembali ke atas ↑</a>
        </div>
      </footer>
    </main>
  );
}
