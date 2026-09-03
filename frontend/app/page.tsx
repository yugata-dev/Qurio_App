"use client";

import { FormEvent, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

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

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Levin beranda">
      <img src="/logo-levin.jpg" alt="" />
      {/* <span className=""></span> */}
    </a>
  );
}

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
          <button
            key={slide.title}
            // Class dasar + class kondisional untuk state aktif
            className={cn(
              "w-2 h-2 p-0 border-0 rounded-full bg-[#cbd5e1] cursor-pointer transition-all duration-200 ease-in-out",
              ` ${index === active ? "w-6 bg-brand-purple" : ""}`,
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
  function submit(event: FormEvent<HTMLFormElement>) {
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

      <button
        className="w-full inline-flex items-center justify-center gap-3 rounded-[15px] px-6 py-3 border-0 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-[#12b886] text-white shadow-[0_12px_25px_rgba(18,184,134,0.2)]"
        type="submit"
      >
        Gabung Sesi Sekarang <span aria-hidden="true">→</span>
      </button>

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

function DemoModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<"student" | "teacher">("student");
  const [toast, setToast] = useState(false);
  function chooseAnswer() {
    setToast(true);
    window.setTimeout(() => {
      setView("teacher");
      setToast(false);
    }, 850);
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-0 items-end sm:p-6 sm:items-center bg-[rgba(16,26,49,0.62)] backdrop-blur-[8px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="w-full max-h-[92vh] overflow-auto p-5 border border-[#dfe7f1] rounded-t-[22px] bg-[#f8fafc] shadow-[0_30px_80px_rgba(10,20,40,0.3)] sm:w-[min(1080px,100%)] sm:max-h-[calc(100vh-48px)] sm:p-[30px] sm:rounded-[26px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
      >
        {/* Modal Head */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="block text-[#5146e8] text-[13px] tracking-[0.12em] font-extrabold mb-2">
              LIVE SANDBOX
            </span>
            <h2 id="demo-title" className="mt-0 text-[32px] tracking-[-0.04em]">
              Coba Demo Interaktif
            </h2>
          </div>
          <button
            className="w-[38px] h-[38px] border border-[#dce5ef] rounded-full bg-white text-[#52647e] text-2xl leading-none cursor-pointer"
            onClick={onClose}
            aria-label="Tutup demo"
          >
            ×
          </button>
        </div>

        {/* Mobile Tabs */}
        <div
          className="grid grid-cols-2 gap-1 mb-4 p-1 rounded-xl bg-[#e9eef5] sm:hidden"
          role="tablist"
          aria-label="Tampilan demo"
        >
          <button
            role="tab"
            aria-selected={view === "student"}
            className={cn(
              "py-[11px] px-2 border-0 rounded-[9px] bg-transparent text-[#73839a] text-xs font-extrabold cursor-pointer",
              view === "student" &&
                "bg-white text-[#5146e8] shadow-[0_2px_7px_rgba(30,44,70,0.1)]",
            )}
            onClick={() => setView("student")}
          >
            View as Student
          </button>
          <button
            role="tab"
            aria-selected={view === "teacher"}
            className={cn(
              "py-[11px] px-2 border-0 rounded-[9px] bg-transparent text-[#73839a] text-xs font-extrabold cursor-pointer",
              view === "teacher" &&
                "bg-white text-[#5146e8] shadow-[0_2px_7px_rgba(30,44,70,0.1)]",
            )}
            onClick={() => setView("teacher")}
          >
            View as Teacher
          </button>
        </div>

        {/* Split Panels */}
        <div className="block sm:grid sm:grid-cols-[1fr_1.3fr] gap-[18px]">
          {/* Student Panel */}
          <article
            className={cn(
              "hidden sm:block min-h-0 sm:min-h-[420px] overflow-hidden border border-[#dce5ef] rounded-[18px] bg-white shadow-[0_12px_25px_rgba(30,44,70,0.08)]",
              view === "student" && "block",
            )}
          >
            <div className="flex items-center justify-between gap-2.5 px-[19px] py-[17px] border-b border-[#e7edf4] text-[#27354d] text-sm">
              <b>Student Mobile View</b>
              <span className="text-white bg-[#12b886] px-2 py-1 rounded text-[10px] font-extrabold">
                ● LIVE
              </span>
            </div>
            <div className="max-w-[280px] mx-auto my-[25px] px-[17px] py-[25px] border-[7px] border-[#19253a] rounded-[29px] bg-white shadow-[0_16px_25px_rgba(21,34,56,0.16)]">
              <span className="block text-[#5146e8] text-center text-[9px] font-extrabold tracking-[0.1em] mb-[15px]">
                PERTANYAAN 4/10
              </span>
              <h3 className="mt-0 text-[#27354d] text-center text-[17px] leading-[1.4] mb-[35px]">
                Planet mana yang dikenal sebagai Planet Merah?
              </h3>
              {[
                ["A", "Venus"],
                ["B", "Mars"],
                ["C", "Jupiter"],
                ["D", "Saturnus"],
              ].map(([letter, answer]) => (
                <button
                  className={cn(
                    "flex items-center gap-3 mt-2.5 p-3 border border-[#e5ebf3] rounded-xl text-[#40516b] text-[13px] font-bold",
                    letter === "B" &&
                      "border-2 border-[#5146e8] text-[#5146e8] bg-[#f0f1ff]",
                  )}
                  onClick={chooseAnswer}
                  key={letter}
                >
                  <b
                    className={cn(
                      "grid place-items-center w-[27px] h-[27px] rounded-[7px] bg-[#f3f6fa] text-[#697993]",
                      letter === "B" && "text-white bg-[#5146e8]",
                    )}
                  >
                    {letter}
                  </b>
                  <span>{answer}</span>
                </button>
              ))}
            </div>
          </article>

          {/* Teacher Panel */}
          <article
            className={cn(
              "hidden sm:block min-h-0 sm:min-h-[420px] overflow-hidden border border-[#dce5ef] rounded-[18px] bg-white shadow-[0_12px_25px_rgba(30,44,70,0.08)]",
              view === "teacher" && "block",
            )}
          >
            <div className="flex items-center justify-between gap-2.5 px-[19px] py-[17px] border-b border-[#e7edf4] text-[#27354d] text-sm">
              <b>Teacher Projector View</b>
              <span className="text-[#8a9bb0] text-[11px]">
                84 siswa bergabung
              </span>
            </div>
            <div className="m-[18px] sm:m-[25px] p-5 rounded-[14px] bg-[#f8fbff]">
              <div className="flex justify-between gap-3 text-[#27354d] text-sm font-extrabold">
                <span>Analitik Kelas · Fisika 101</span>
                <strong className="text-[#12b886] text-[11px]">
                  Jawaban live
                </strong>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end justify-around h-[230px] px-[18px] pt-[25px] border-b border-[#dce5ef]">
                <div className="flex h-full flex-col items-center justify-end gap-2 text-[#657894] text-[10px]">
                  <span
                    className="block w-[38px] min-h-[24px] rounded-t-[7px] bg-[#5146e8]"
                    style={{ height: "72%" }}
                  />
                  <b>Gravitasi</b>
                </div>
                <div className="flex h-full flex-col items-center justify-end gap-2 text-[#657894] text-[10px]">
                  <span
                    className="block w-[38px] min-h-[24px] rounded-t-[7px] bg-[#12b886]"
                    style={{ height: "54%" }}
                  />
                  <b>Energi</b>
                </div>
                <div className="flex h-full flex-col items-center justify-end gap-2 text-[#657894] text-[10px]">
                  <span
                    className="block w-[38px] min-h-[24px] rounded-t-[7px] bg-[#7c88ef]"
                    style={{ height: "38%" }}
                  />
                  <b>Gaya</b>
                </div>
                <div className="flex h-full flex-col items-center justify-end gap-2 text-[#657894] text-[10px]">
                  <span
                    className="block w-[38px] min-h-[24px] rounded-t-[7px] bg-[#aebbd0]"
                    style={{ height: "25%" }}
                  />
                  <b>Massa</b>
                </div>
              </div>

              {/* Result */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-3.5 border-t border-[#e5ebf3] text-[#566983] text-[11px]">
                <span>
                  <b className="text-[#5146e8] text-[17px]">72%</b> menjawab
                  benar
                </span>
                <span className="text-[#12b886]">
                  AI membaca pola pemahaman
                </span>
              </div>
            </div>
          </article>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className="fixed left-1/2 bottom-[88px] sm:bottom-[28px] z-[60] -translate-x-1/2 w-[calc(100%-32px)] sm:w-auto px-[18px] py-[13px] rounded-xl bg-[#12b886] text-white shadow-[0_12px_25px_rgba(18,184,134,0.28)] text-[13px] font-extrabold text-center sm:text-left whitespace-normal sm:whitespace-nowrap"
            role="status"
          >
            Response Sent! Switching to Teacher View...
          </div>
        )}

        {/* Mobile Primary CTA */}
        <a
          className="flex sm:hidden sticky bottom-0 items-center justify-center gap-2 mt-[18px] p-3.5 rounded-[13px] bg-[#12b886] text-white text-sm font-extrabold shadow-[0_8px_16px_rgba(18,184,134,0.22)]"
          href="#cta"
          onClick={onClose}
        >
          Buat Sesi Kelas Gratis <span aria-hidden="true">→</span>
        </a>

        {/* Footnote */}
        <p className="mt-[19px] text-[#8495ac] text-center text-xs">
          Sandbox aktif dengan data contoh. Tidak perlu login atau mengunduh
          aplikasi.
        </p>
      </section>
    </div>
  );
}

export default function App() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <main id="top">
      <header className="sm:h-20 h-17.5 bg-white border-b border-(--line)">
        {/* <div className="sm:w-[max(100%-32px,640px)] h-full w-full flex items-center justify-between gap-8"> */}
        <div className="w-full max-w-160 px-4 sm:px-0 h-full flex items-center justify-between gap-8">
          <Logo />
          <nav
            aria-label="Navigasi utama"
            className="hidden sm:flex sm:gap-10 sm:mx-auto sm:text-sm sm:font-bold sm:text-[#43536d]"
          >
            <a href="#features">Fitur</a>
            <a href="#modes">Cara Kerja</a>
            <a href="#cta">Harga</a>
          </nav>
          <div className="flex items-center gap-3 ml-auto text-sm font-bold text-slate-600 [&>a:first-child]:hidden sm:gap-8 sm:ml-0 sm:[&>a:first-child]:block">
            <a href="#access">Masuk</a>
            <a
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3 border-0 font-extrabold text-small cursor-pointer transition-all duration-200 bg-brand-purple text-white shadow-[0_12px_25px_rgba(81,70,232,0.22)] hover:-translate-y-0.5 hover:shadow-xl"
              href="#cta"
            >
              Daftar Gratis
            </a>
          </div>
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
        aria-label="Levin key highlights"
      >
        <div className="flex w-max animate-[liven-marquee-scroll_34s_linear_infinite] motion-reduce:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
          <div className="flex items-center gap-7 px-7 py-[17px] whitespace-nowrap text-[#263651] text-base font-bold">
            <span>⚡ Levin: Transparansi Kemampuan Intelektual Murid</span>
            <b className="text-emerald-500 text-lg">✦</b>
            <span>Tanpa Download Aplikasi &amp; Tanpa Login Siswa</span>
            <b className="text-emerald-500 text-lg">⚡</b>
            <span>Analisis Pemahaman Berbasis AI Real-Time</span>
            <b className="text-emerald-500 text-lg">✦</b>
            <span>
              Kuis Interaktif, Word Cloud &amp; Q&amp;A dalam Satu Tempat
            </span>
            <b className="text-emerald-500 text-lg">⚡</b>
            <span>WebSocket Super Cepat (0.1s Response)</span>
          </div>

          <div
            className="flex items-center gap-7 px-7 py-[17px] whitespace-nowrap text-brand-text-dark text-base font-bold"
            aria-hidden="true"
          >
            <span>⚡ Levin: Transparansi Kemampuan Intelektual Murid</span>
            <b className="text-emerald-500 text-lg">✦</b>
            <span>Tanpa Download Aplikasi &amp; Tanpa Login Siswa</span>
            <b className="text-emerald-500 text-lg">⚡</b>
            <span>Analisis Pemahaman Berbasis AI Real-Time</span>
            <b className="text-emerald-500 text-lg">✦</b>
            <span>
              Kuis Interaktif, Word Cloud &amp; Q&amp;A dalam Satu Tempat
            </span>
            <b className="text-emerald-500 text-lg">⚡</b>
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
                className="p-7 min-h-68 border border-[#e5ebf3] rounded-[24px] bg-[#f8fafc] shadow-[0_14px_28px_rgba(30,44,70,0.07)]"
                key={title}
              >
                <span className="grid place-items-center w-16 h-16 mb-9 rounded-[15px] bg-white text-brand-purple shadow-[0_5px_12px_#e8edf4] text-[27px]">
                  {icon}
                </span>
                <h3 className="mt-0 text-[23px] mb-5">{title}</h3>
                <p className="mt-0 text-[#50627d] leading-[1.6] text-[16px]">
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
            <article className="p-7 border border-[#e5ebf3] rounded-[24px] bg-white shadow-[0_14px_28px_rgba(30,44,70,0.07)]">
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
            <article className="p-[28px] border border-[#e5ebf3] rounded-[24px] bg-white shadow-[0_14px_28px_rgba(30,44,70,0.07)]">
              <span className="block mb-[19px] text-[#12b886] text-[11px] font-extrabold tracking-[0.12em]">
                02
              </span>
              <h3 className="mt-0 mb-[10px] text-[22px]">
                Tanya Jawab (Q&amp;A)
              </h3>
              <p className="mt-0 min-h-[52px] text-[#50627d] leading-[1.5] text-[15px]">
                Papan diskusi termoderasi agar semua pertanyaan terdengar.
              </p>

              {/* Pertanyaan 1 */}
              <div className="flex gap-[16px] mt-[15px] p-[16px] border-2 border-[#edf1f6] rounded-[15px] text-[#40516b] font-bold items-center">
                <span className="grid place-items-center flex-none w-[40px] h-[40px] rounded-full text-[#5146e8] bg-[#dfe4ff] font-extrabold">
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
              <div className="flex gap-[16px] mt-[15px] p-[16px] border-2 border-[#edf1f6] rounded-[15px] text-[#40516b] font-bold items-center">
                <span className="grid place-items-center flex-none w-[40px] h-[40px] rounded-full text-[#079d70] bg-[#dffbef] font-extrabold">
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
              <span className="block mb-5 text-indigo-600 text-xs font-extrabold tracking-widest">
                03
              </span>
              <h3 className="mt-0 mb-2.5 text-2xl">Kuis (Quiz)</h3>
              <p className="mt-0 min-h-[52px] text-slate-600 leading-normal text-[15px]">
                Evaluasi kognitif interaktif dengan leaderboard instan.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50">
                <span className="block w-max mx-auto mb-3 px-2 py-1 rounded-lg bg-orange-50 text-orange-500 text-xs font-extrabold">
                  00:18
                </span>

                <b className="block mb-2.5 text-slate-800 text-sm">
                  Planet Merah?
                </b>

                <div className="flex items-center gap-2 mt-2 p-2 border border-slate-200 rounded-lg text-slate-600 text-xs">
                  <i className="grid place-items-center w-6 h-6 rounded-md bg-slate-100 text-slate-500 not-italic font-extrabold">
                    A
                  </i>
                  <span>Venus</span>
                </div>

                <div className="flex items-center gap-2 mt-2 p-2 border border-indigo-600 rounded-lg text-indigo-600 bg-indigo-50 text-xs">
                  <i className="grid place-items-center w-6 h-6 rounded-md bg-indigo-600 text-white not-italic font-extrabold">
                    B
                  </i>
                  <span>Mars</span>
                  <strong className="ml-auto text-emerald-500 text-[10px]">
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
                <small>Pengguna Levin</small>
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
              — Siswa Kelas X (Pengguna Levin)
            </span>
          </div>
        </div>
      </section> */}
      <section className="pt-[100px] pb-[120px] text-white bg-[#111a2e]">
        {/* Perbaikan: hapus titik di depan className */}
        <div className="w-full max-w-[1216px] mx-auto px-6">
          <div className="text-center mb-[78px]">
            <span className="block text-[#12b886] text-[13px] tracking-[0.12em] font-extrabold mb-[25px]">
              MULAI DALAM HITUNGAN DETIK
            </span>
            <h2 className="mt-0 text-white text-[38px] tracking-[-0.04em] mb-4">
              Mulai Live dalam 3 Langkah Mudah
            </h2>
            <p className="mt-0 text-[#9cacbf] text-lg leading-normal">
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
                className="relative py-10 px-[34px] text-center border border-[#30405a] rounded-[28px] bg-[#172239] after:content-[''] after:absolute after:top-1/2 after:left-full after:w-12 after:border-t-2 after:border-[#3936a5] after:hidden md:after:block"
                key={num}
              >
                <span
                  className={cn(
                    "grid place-items-center w-16 h-16 mx-auto mb-[30px] rounded-[17px] bg-[#5146e8] text-white text-2xl font-extrabold shadow-[0_10px_17px_rgba(81,70,232,0.28)]",
                    num === "2" && "bg-[#12b886]",
                  )}
                >
                  {num}
                </span>
                <h3 className="mt-0 text-[19px]">{title}</h3>
                <p className="mt-0 text-[#9cacbf] leading-normal">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="cta"
        className="pt-28 pb-32 text-center bg-gradient-to-b from-indigo-50 to-transparent"
      >
        <div className="w-full max-w-[1216px] mx-auto px-6">
          <h2 className="mt-0 text-3xl tracking-tighter mb-6">
            Buat kelas Anda{" "}
            <em className="not-italic text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-8">
              lebih transparan.
            </em>
          </h2>

          <p className="mt-0 text-slate-600 leading-relaxed text-xl">
            Mulai pahami setiap murid dengan data yang bermakna.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-6 mt-9">
            <a
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4 border-0 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              href="#access"
            >
              Mulai Analisis Kelas Gratis
            </a>

            <button
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4 border-2 border-slate-200 font-extrabold text-base cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-slate-700 bg-white"
              type="button"
              onClick={() => setDemoOpen(true)}
            >
              Coba Demo Interaktif (Tanpa Login){" "}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
      <footer className="pt-[70px] pb-9 border-t border-slate-200 bg-slate-50">
        <div className="w-full max-w-[1216px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo />
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

        <div className="w-full max-w-[1216px] mx-auto px-6 flex flex-col sm:flex-row justify-between gap-5 pt-9 mt-14 border-t border-slate-200 text-slate-400 text-xs">
          <span>
            © 2026 Levin Interaction Inc. Hak cipta dilindungi undang-undang.
          </span>
          <span>Ketentuan Layanan　 Kebijakan Privasi　 Pengaturan Cookie</span>
        </div>
      </footer>
      {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
    </main>
  );
}