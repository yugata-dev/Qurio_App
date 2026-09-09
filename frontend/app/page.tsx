"use client";
import { fetchUserRegister } from "@/lib/api";
import { useForm } from "react-hook-form";
import RegisterPage from "./(auth)/register/page";

import Link from "next/link";
import { SubmitEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

// import icon
import { IconLogin2 } from "@tabler/icons-react";

const heroSlides = [
  {
    title: "Transparansi Kemampuan Intelektual Murid, Ditenagai AI",
    text: "AI memetakan pemahaman kognitif dan keaktifan siswa secara otomatis tanpa membuat guru repot.",
  },
  {
    title: "Masuk Kelas Instan Tanpa Login",
    text: "Siswa cukup mengetik 6-digit kode via HP. Tanpa unduh aplikasi atau registrasi akun.",
  },
  {
    title: "Ubah Kelas Pasif Menjadi Live & Interaktif",
    text: "Ditenagai WebSocket real-time untuk respon Word Cloud, Q&A, dan Kuis langsung di proyektor.",
  },
];

const featureCards = [
  [
    "◉",
    "Deep Student Insight",
    "Peta pemahaman individu: siapa yang sudah paham dan siapa yang butuh pendampingan.",
  ],
  [
    "⌁",
    "Real-time Diagnostic",
    "Deteksi topik yang paling membingungkan kelas secara otomatis saat sesi berlangsung.",
  ],
  [
    "◆",
    "Objective Evaluation",
    "Transparansi data nilai dan cara berpikir siswa tanpa bias.",
  ],
  [
    "↗",
    "Automated Summary",
    "Laporan evaluasi berbasis AI yang siap diunduh guru setelah kelas.",
  ],
];

// function Logo() {
//   return (

//   );
// }

function HeroSlider() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(
      () => setActive((current) => (current + 1) % heroSlides.length),
      5200,
    );
    return () => window.clearInterval(interval);
  }, []);
  return (
    <>
      <div
        className="min-h-55 flex flex-col items-center justify-center p-4"
        aria-live="polite"
      >
        <h1 className="max-w-205 m-0 text-(--ink) text-[clamp(42px,5.2vw,72px)] leading-[1.04] tracking-[-0.055em] text-balance">
          {heroSlides[active].title}
        </h1>
        <p className="max-w-162.5 mx-auto mt-6.25 text-[#51627c] text-base leading-[1.65] text-balance">
          {heroSlides[active].text}
        </p>
      </div>
      <div className="flex gap-2 mt-6 mb-8" aria-label="Pilih pesan hero">
        {heroSlides.map((slide, index) => (
          <Button
            key={slide.title}
            // Class dasar + class kondisional untuk state aktif
            className={cn(
              "w-2 h-2 p-0 border-0 rounded-full bg-[#cbd5e1] cursor-pointer transition-all duration-200 ease-in-out",
              ` ${index === active ? "w-6 bg-primary" : ""}`,
            )}
            aria-label={`Slide ${index + 1}`}
            aria-current={index === active ? "true" : undefined}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </>
  );
}

function AccessForm() {
  const [message, setMessage] = useState("");
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") || "").trim();
    const name = String(data.get("name") || "").trim();
    setMessage(
      code.length === 6 && name
        ? "Kode siap! Menghubungkan Anda ke sesi."
        : "Lengkapi kode 6 digit dan nama Anda.",
    );
  }
  return (
    <form
      id="access"
      className="max-w-md mt-8 pt-8 px-8 pb-8 rounded-3xl bg-white shadow-[0_22px_35px_rgba(30,44,70,0.14)]"
      onSubmit={submit}
      aria-label="Form masuk ruang kelas"
    >
      <h3 className="text-[18px] mb-7">Masuk Ruang Kelas Instan</h3>

      <label
        htmlFor="code"
        className="text-left block mb-2 text-[#8fa0ba] uppercase tracking-[0.04em] text-xs font-extrabold"
      >
        Kode Akses 6-Digit <span>(Cth: A7B3K9)</span>
      </label>
      <input
        id="code"
        name="code"
        inputMode="text"
        maxLength={6}
        placeholder="Masukkan kode akses"
        className="w-full h-16 mb-5 px-4 border border-[#dae3ef] rounded-xl bg-[#f8fafc] text-[#101a31] text-base outline-brand-purple"
      />

      <label
        htmlFor="name"
        className="text-left block mb-2 text-[#8fa0ba] uppercase tracking-[0.04em] text-xs font-extrabold"
      >
        Nama Lengkap Kamu
      </label>
      <input
        id="name"
        name="name"
        placeholder="Masukkan nama lengkap"
        className="w-full h-16 mb-5 px-4 border border-[#dae3ef] rounded-xl bg-[#f8fafc] text-[#101a31] text-base outline-brand-purple"
      />

      <Button
        className="w-full inline-flex items-center justify-center gap-3 rounded-[15px] px-6 py-6! border-0 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-primary text-white shadow-[0_12px_25px_rgba(14,165,233,0.2)]"
        type="submit"
      >
        Gabung Sesi Sekarang <span aria-hidden="true">→</span>
      </Button>

      <p className="mt-4 text-center text-[#8b9ab0] text-xs">
        Tanpa perlu buat akun atau unduh aplikasi.
      </p>

      {message && (
        <p className="mt-3 text-brand-purple text-[13px]" role="status">
          {message}
        </p>
      )}
    </form>
  );
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <main id="top">
      <header className="sticky top-0 z-40 sm:h-20 h-18 bg-white/70 backdrop-blur-sm border-b border-(--line)">
        {/* <div className="sm:w-[max(100%-32px,640px)] h-full w-full flex items-center justify-between gap-8"> */}
        {/* <div className="w-full px-4! sm:px-0 h-full flex items-center justify-between gap-8"> */}
        <div className="w-full px-4 sm:px-8 h-full flex items-center justify-between gap-8">
          <a className="logo" href="#top" aria-label="Qurio beranda">
            <img src="/qurio_ramping.png" alt="" draggable={false} />
            {/* <span className=""></span> */}
          </a>
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex md:gap-10 md:mx-auto md:text-sm md:font-bold md:text-[#43536d]"
          >
            <a href="#features">Fitur</a>
            <a href="#modes">Cara Kerja</a>
            <a href="#cta">Harga</a>
          </nav>
          {/* <div className="flex items-center gap-3 ml-auto text-sm font-bold text-slate-600 [&>a:first-child]:hidden sm:gap-8 sm:ml-0 sm:[&>a:first-child]:block"> */}
          <Link
            className="inline-flex items-center justify-center gap-2.5 rounded-full px-5 py-3 border-0 font-extrabold text-small cursor-pointer transition-all duration-200 bg-primary text-white shadow-[0_12px_25px_rgba(81,70,232,0.22)] hover:-translate-y-0.5 hover:shadow-xl"
            href="/login"
          >
            <span>Masuk</span>
            <IconLogin2 className="w-4 h-4" />
          </Link>
          {/* </div> */}
        </div>
      </header>
      <section className="min-h-[calc(100vh-80px)] flex items-start justify-center overflow-hidden bg-[radial-gradient(circle_at_75%_22%,#e9edff_0,#f5f8fc_40%,#f8fafc_76%)] pt-18.75 pb-27.5 lg:pt-28 lg:pb-32">
        <div className=".container-custom">
          <div className="max-w-205 mx-auto flex flex-col items-center text-center">
            <span className="inline-flex gap-2 items-center text-brand-green-dark bg-brand-green-light border border-green-border rounded-[30px] px-4 py-2 text-sm font-bold mb-6">
              <span className="text-brand-green">●</span> AI-Powered Classroom
              Analytics
            </span>

            <HeroSlider />
            <AccessForm />
            <a
              className="mt-6 text-brand-purple text-sm hover:underline"
              href="#cta"
            >
              Apakah Anda seorang Guru?
              <strong className="font-extrabold"> Buat Sesi Gratis →</strong>
            </a>
          </div>
        </div>
      </section>
      <section
        className="w-full overflow-hidden border-y border-[#dfe7f1] bg-brand-bg-light group"
        aria-label="Qurio key highlights"
      >
        <div className="flex w-max animate-[qurio-marquee-scroll_34s_linear_infinite] motion-reduce:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
          <div className="flex items-center gap-7 px-7 py-[17px] whitespace-nowrap text-brand-text-dark text-base font-bold">
            <span>⚡ Qurio: Transparansi Kemampuan Intelektual Murid</span>
            <b className="text-sky-500 text-lg">✦</b>
            <span>Tanpa Download Aplikasi &amp; Tanpa Login Siswa</span>
            <b className="text-sky-500 text-lg">⚡</b>
            <span>Analisis Pemahaman Berbasis AI Real-Time</span>
            <b className="text-sky-500 text-lg">✦</b>
            <span>
              Kuis Interaktif, Word Cloud &amp; Q&amp;A dalam Satu Tempat
            </span>
            <b className="text-sky-500 text-lg">⚡</b>
            <span>WebSocket Super Cepat (0.1s Response)</span>
          </div>

          <div
            className="flex items-center gap-7 px-7 py-[17px] whitespace-nowrap text-brand-text-dark text-base font-bold"
            aria-hidden="true"
          >
            <span>⚡ Qurio: Transparansi Kemampuan Intelektual Murid</span>
            <b className="text-sky-500 text-lg">✦</b>
            <span>Tanpa Download Aplikasi &amp; Tanpa Login Siswa</span>
            <b className="text-sky-500 text-lg">⚡</b>
            <span>Analisis Pemahaman Berbasis AI Real-Time</span>
            <b className="text-sky-500 text-lg">✦</b>
            <span>
              Kuis Interaktif, Word Cloud &amp; Q&amp;A dalam Satu Tempat
            </span>
            <b className="text-sky-500 text-lg">⚡</b>
            <span>WebSocket Super Cepat (0.1s Response)</span>
          </div>
        </div>
      </section>
      <section id="features" className="py-24">
        {/* Perbaikan: hapus titik di depan className, gunakan max-w dan px untuk simulasi min() */}
        <div className="w-full max-w-304 mx-auto px-6">
          <div className="text-center mb-19.5">
            <span className="block text-brand-purple text-[13px] tracking-widest font-extrabold mb-[25px]">
              TRANSPARANSI AI
            </span>
            <h2 className="mt-0 text-3xl tracking-[-0.04em] mb-4">
              Setiap respons adalah insight.
            </h2>
            <p className="mt-0 text-[#536682] text-[18px] leading-normal">
              Jadikan data kelas sebagai keputusan belajar yang tepat sasaran.
            </p>
          </div>

          {/* Responsif: 1 kolom di <620px, 2 kolom di 621-900px, 4 kolom di >900px */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureCards.map(([icon, title, copy]) => (
              <article
                className="p-7 min-h-68 border border-[#e5ebf3] rounded-6 bg-[#f8fafc] shadow-[0_14px_28px_rgba(30,44,70,0.07)]"
                key={title}
              >
                <span className="grid place-items-center w-16 h-16 mb-9 rounded-[15px] bg-white text-brand-purple shadow-[0_5px_12px_#e8edf4] text-[27px]">
                  {icon}
                </span>
                <h3 className="mt-0 text-[23px] mb-5">{title}</h3>
                <p className="mt-0 text-[#50627d] leading-[1.6] text-4">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="modes" className="pt-24 pb-24 bg-[#f8fafc]">
        <div className="w-full max-w-304 mx-auto px-6">
          <div className="text-center mb-20">
            <span className="block text-brand-purple text-[13px] tracking-[0.12em] font-extrabold mb-6">
              3 CORE INTERACTIONS
            </span>
            <h2 className="mt-0 text-3xl tracking-[-0.04em] mb-4">
              Interaksi yang membuat AI bekerja.
            </h2>
            <p className="mt-0 text-[#536682] text-lg leading-normal">
              Bangun sinyal pemahaman dari setiap suara di kelas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="p-7 border border-[#e5ebf3] rounded-6 bg-white shadow-[0_14px_28px_rgba(30,44,70,0.07)]">
              <span className="block mb-5 text-brand-purple text-[11px] font-extrabold tracking-[0.12em]">
                01
              </span>
              <h3 className="mt-0 mb-3 text-[22px]">Word Cloud</h3>
              <p className="mt-0 min-h-13 text-[#50627d] leading-normal text-[15px]">
                Curah pendapat live yang memetakan kata dan pola pikir kelas.
              </p>
              <div className="flex min-h-36 flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
                <b className="text-brand-purple text-[34px]">Konsep</b>
                <em className="text-[#7c88ef] text-[26px] not-italic">Seru</em>
                <strong className="text-[12b886] text-[18px]">
                  Eksperimen
                </strong>
                <span className="text-[#91a3bd] text-[15px]">Berani</span>
                <i className="text-[#2aca96] text-[20px] not-italic">Ide</i>
                <small className="text-[#c4cede]">Diskusi</small>
              </div>
            </article>
            <article className="p-7 border border-[#e5ebf3] rounded-6 bg-white shadow-[0_14px_28px_rgba(30,44,70,0.07)]">
              <span className="block mb-[19px] text-sky-500 text-[11px] font-extrabold tracking-[0.12em]">
                02
              </span>
              <h3 className="mt-0 mb-[10px] text-[22px]">
                Tanya Jawab (Q&amp;A)
              </h3>
              <p className="mt-0 min-h-13 text-[#50627d] leading-[1.5] text-[15px]">
                Papan diskusi termoderasi agar semua pertanyaan terdengar.
              </p>

              {/* Pertanyaan 1 */}
              <div className="flex gap-4 mt-[15px] p-4 border-2 border-[#edf1f6] rounded-[15px] text-[#40516b] font-bold items-center">
                <span className="grid place-items-center flex-none w-10 h-10 rounded-full text-brand-purple bg-[#dfe4ff] font-extrabold">
                  AJ
                </span>
                <div>
                  <b className="text-[#253149] text-[11px] block mb-[5px]">
                    Bisakah dijelaskan lagi?
                  </b>
                  <small className="text-[#9aa9bd] text-[9px] block">
                    18 upvote · Direkomendasikan AI
                  </small>
                </div>
              </div>

              {/* Pertanyaan 2 */}
              <div className="flex gap-4 mt-[15px] p-4 border-2 border-[#edf1f6] rounded-[15px] text-[#40516b] font-bold items-center">
                <span className="grid place-items-center flex-none w-10 h-10 rounded-full text-[#079d70] bg-[#dffbef] font-extrabold">
                  RN
                </span>
                <div>
                  <b className="text-[#253149] text-[11px] block mb-[5px]">
                    Contoh di kehidupan nyata?
                  </b>
                  <small className="text-[#9aa9bd] text-[9px] block">
                    9 upvote · Menunggu moderasi
                  </small>
                </div>
              </div>
            </article>
            <article className="p-7 border border-slate-200 rounded-3xl bg-white shadow-lg">
              <span className="block mb-5 text-blue-600 text-xs font-extrabold tracking-widest">
                03
              </span>
              <h3 className="mt-0 mb-2.5 text-2xl">Kuis (Quiz)</h3>
              <p className="mt-0 min-h-13 text-slate-600 leading-normal text-[15px]">
                Evaluasi kognitif interaktif dengan leaderboard instan.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50">
                {/* <span className="block w-max mx-auto mb-3 px-2 py-1 rounded-lg bg-orange-50 text-orange-500 text-xs font-extrabold">
                  00:18
                </span> */}

                <b className="block mb-2.5 text-slate-800 text-sm">
                  Planet Merah?
                </b>

                <div className="flex items-center gap-2 mt-2 p-2 border border-slate-200 rounded-lg text-slate-600 text-xs">
                  <i className="grid place-items-center w-6 h-6 rounded-md bg-slate-100 text-slate-500 not-italic font-extrabold">
                    A
                  </i>
                  <span>Venus</span>
                </div>

                <div className="flex items-center gap-2 mt-2 p-2 border border-blue-600 rounded-lg text-blue-600 bg-blue-50 text-xs">
                  <i className="grid place-items-center w-6 h-6 rounded-md bg-blue-600 text-white not-italic font-extrabold">
                    B
                  </i>
                  <span>Mars</span>
                  <strong className="ml-auto text-sky-500 text-[10px]">
                    #1
                  </strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
      {/* <section className="quote-section">
        <div className=".container-custom">
          <div className="quote-card">
            <div className="student-badge">
              <span className="student-avatar">N</span>
              <span>
                <b>Siswa Kelas X</b>
                <small>Pengguna Qurio</small>
              </span>
            </div>
            <div className="stars" aria-label="5 dari 5 bintang">
              ★ ★ ★ ★ ★
            </div>
            <blockquote>
              “Suara semua orang terdengar tanpa perlu tunjuk tangan. Kelas jadi
              jauh lebih hidup dan tidak membosankan!”
            </blockquote>
            <span className="quote-accent">
              — Siswa Kelas X (Pengguna Qurio)
            </span>
          </div>
        </div>
      </section> */}
      <section className="pt-25 pb-30 text-(--ink) bg-[#f8fafc]">
        {/* Perbaikan: hapus titik di depan className */}
        <div className="w-full max-w-304 mx-auto px-6">
          <div className="text-center mb-[78px]">
            <span className="block text-sky-500 text-[13px] tracking-[0.12em] font-extrabold mb-[25px]">
              MULAI DALAM HITUNGAN DETIK
            </span>
            <h2 className="mt-0 text-(--ink) text-[38px] tracking-[-0.04em] mb-4">
              Mulai Live dalam 3 Langkah Mudah
            </h2>
            <p className="mt-0 text-[#536682] text-lg leading-normal">
              Dari nol hingga analitik kelas aktif. Tidak perlu keahlian teknis.
            </p>
          </div>

          {/* Grid: 1 kolom di mobile, 3 kolom di md (768px). Gap 48px = gap-12 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              [
                "1",
                "Guru Membuat Sesi",
                "Siapkan pertanyaan dan pilih mode interaksi.",
              ],
              [
                "2",
                "Siswa Memasukkan Kode",
                "Siswa bergabung dengan 6 digit kode tanpa login.",
              ],
              [
                "3",
                "AI Membaca Pola",
                "Lihat insight, rekomendasi, dan hasil secara instan.",
              ],
            ].map(([num, title, copy]) => (
              <article
                className="relative py-10 px-[34px] text-center border border-[#e5ebf3] rounded-7 bg-white shadow-[0_14px_28px_rgba(30,44,70,0.07)] after:content-[''] after:absolute after:top-1/2 after:left-full after:w-12 after:border-t-2 after:border-blue-200 after:hidden md:after:block"
                key={num}
              >
                <span
                  className={cn(
                    "grid place-items-center w-16 h-16 mx-auto mb-[30px] rounded-[17px] bg-primary text-white text-2xl font-extrabold shadow-[0_10px_17px_rgba(37,99,235,0.24)]",
                    num === "2" && "bg-sky-500",
                  )}
                >
                  {num}
                </span>
                <h3 className="mt-0 text-[19px]">{title}</h3>
                <p className="mt-0 text-[#536682] leading-normal">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="pt-[70px] pb-9 border-t border-slate-200 bg-slate-50">
        <div className="w-full max-w-304 mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="w-20">
              <a className="logo" href="#top" aria-label="Qurio beranda">
                <img src="/qurio.png" alt="" draggable={false} />
                {/* <span className=""></span> */}
              </a>
            </div>
            <p className="mt-6 text-slate-500 leading-relaxed">
              Platform analitik kelas yang membantu guru
              <br /> memahami setiap suara dan pola belajar.
            </p>
            <div className="flex gap-3.5 mt-7">
              <span className="grid place-items-center w-10 h-10 border border-slate-200 rounded-full text-slate-400 text-sm font-extrabold">
                t
              </span>
              <span className="grid place-items-center w-10 h-10 border border-slate-200 rounded-full text-slate-400 text-sm font-extrabold">
                in
              </span>
              <span className="grid place-items-center w-10 h-10 border border-slate-200 rounded-full text-slate-400 text-sm font-extrabold">
                ▶
              </span>
            </div>
          </div>

          {[
            ["Produk", "Fitur", "Mode Interaksi", "Harga", "Integrasi"],
            ["Sumber Daya", "Pusat Bantuan", "Blog", "Template", "Komunitas"],
            ["Perusahaan", "Tentang Kami", "Karir", "Kontak", "Privasi"],
          ].map(([title, ...links]) => (
            <div className="flex flex-col gap-4" key={title}>
              <b className="mb-2">{title}</b>
              {links.map((link) => (
                <a
                  href="#top"
                  key={link}
                  className="text-slate-500 text-sm hover:text-slate-900 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="w-full max-w-304 mx-auto px-6 flex flex-col sm:flex-row justify-between gap-5 pt-9 mt-14 border-t border-slate-200 text-slate-400 text-xs">
          <span>
            © 2026 Qurio Interaction Inc. Hak cipta dilindungi undang-undang.
          </span>
          <span>Ketentuan Layanan　 Kebijakan Privasi　 Pengaturan Cookie</span>
        </div>
      </footer>
    </main>
  );
}
