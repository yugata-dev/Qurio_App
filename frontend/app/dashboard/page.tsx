"use client";

import {
  IconCopy,
  IconDotsVertical,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const overviewItems = [
  { label: "Total Quizzes", value: "24", detail: "Semua kuis dibuat" },
  { label: "Active Sessions", value: "3", detail: "Berlangsung saat ini" },
  {
    label: "Total Participants",
    value: "156",
    detail: "Siswa aktif terdaftar",
  },
  { label: "Average Score", value: "78.5", detail: "Performa gabungan" },
];

const sessions = [
  {
    title: "Kuis Matematika Bab 3",
    code: "A7K3X9",
    type: "Quiz",
    students: "32 Siswa",
    score: "82.4",
    status: "Active",
  },
  {
    title: "Latihan Bahasa Indonesia",
    code: "P2M8L4",
    type: "Quiz",
    students: "28 Siswa",
    score: "76.8",
    status: "Completed",
  },
  {
    title: "Evaluasi IPA — Sistem Tata Surya",
    code: "R6T1Q5",
    type: "Quiz",
    students: "35 Siswa",
    score: "84.1",
    status: "Active",
  },
  {
    title: "Kuis Sejarah Indonesia",
    code: "K9N4B2",
    type: "Quiz",
    students: "31 Siswa",
    score: "71.2",
    status: "Completed",
  },
  {
    title: "Latihan Bahasa Inggris",
    code: "W3F7C8",
    type: "Quiz",
    students: "30 Siswa",
    score: "79.6",
    status: "Completed",
  },
];

function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Ringkasan aktivitas kelas dan performa siswa Qurio Anda
        </p>
      </header>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewItems.map(({ label, value, detail }) => (
          <Card
            key={label}
            className="rounded-[20px] border-[#e2e8f0] py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)]"
          >
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[13px] font-medium text-[#64748b]">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
                {value}
              </p>
              <p className="mt-1 text-[11px] text-[#64748b]">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-[20px] border-[#e2e8f0] py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)]">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Aktivitas Sesi Terbaru
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-full border-0 bg-[#ece6f0] pl-10 shadow-none"
                placeholder="Cari sesi..."
              />
            </div>
            <Button
              variant="outline"
              className="h-10 justify-between border-[#e4e4e7] px-4 text-[#64748b] sm:w-[200px]"
            >
              Semua status <span>⌄</span>
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#f1f5f9] text-xs font-semibold text-[#64748b]">
                <tr>
                  <th className="rounded-tl-xl px-4 py-3">Nama sesi</th>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Peserta</th>
                  <th className="px-4 py-3">Nilai rata-rata</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="rounded-tr-xl px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr
                    key={session.code}
                    className={index % 2 ? "bg-[#f8fafc]" : "bg-white"}
                  >
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5 font-medium text-[var(--ink)]">
                      {session.title}
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5">
                      <span className="font-semibold text-[#334155]">
                        {session.code}
                      </span>
                      <Button variant="ghost" size="icon-xs" className="ml-2">
                        <IconCopy className="size-3 text-[#64748b]" />
                      </Button>
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5 text-[#64748b]">
                      {session.type}
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5 text-[#64748b]">
                      {session.students}
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5 font-semibold text-[var(--ink)]">
                      {session.score}
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5">
                      <span
                        className={
                          session.status === "Active"
                            ? "rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#10b981]"
                            : "rounded-full bg-[#e2e8f0] px-3 py-1 text-xs font-semibold text-[#64748b]"
                        }
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="border-b border-[#e2e8f0] px-4 py-3.5">
                      <Button variant="ghost" size="icon-xs">
                        <IconDotsVertical className="size-4 text-[#64748b]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6 rounded-[20px] border-[#e2e8f0] py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)]">
        <CardContent className="p-6">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Analitik
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <IconUsers className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Keterlibatan peserta</p>
              <p className="mt-1 text-xs text-[#64748b]">
                Pantau keaktifan siswa di tiap sesi.
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-2xl font-bold">78.5</p>
              <p className="mt-2 text-sm font-semibold">Nilai rata-rata</p>
              <p className="mt-1 text-xs text-[#64748b]">
                Performa gabungan semua kuis.
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4">
              <p className="text-2xl font-bold">3</p>
              <p className="mt-2 text-sm font-semibold">Sesi berlangsung</p>
              <p className="mt-1 text-xs text-[#64748b]">
                Sesi aktif yang dapat dipantau sekarang.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default DashboardPage;
