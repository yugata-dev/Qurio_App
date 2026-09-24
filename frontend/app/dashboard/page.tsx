"use client";

import { useEffect, useState } from "react";
import { IconCopy, IconDotsVertical, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSessions, type SessionListItem } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DashboardPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSessions()
      .then((sessionList) => {
        if (isMounted) setSessions(sessionList);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Sesi gagal dimuat",
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewItems = [
    {
      label: "Total Sesi",
      value: String(sessions.length),
      detail: "Semua sesi milik Anda",
    },
    {
      label: "Sesi Aktif",
      value: String(
        sessions.filter((session) => session.status === "active").length,
      ),
      detail: "Sedang berlangsung",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan aktivitas kelas dan performa siswa Qurio Anda
        </p>
      </header>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {overviewItems.map(({ label, value, detail }) => (
          <Card
            key={label}
            className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none"
          >
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <p className="text-[28px] font-bold tracking-tight text-foreground">
                {value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">
            Aktivitas Sesi Terbaru
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-full border-0 bg-muted pl-10 shadow-none"
                placeholder="Cari sesi..."
              />
            </div>
            <Button
              variant="outline"
              className="h-10 justify-between border-border px-4 text-muted-foreground sm:w-[200px]"
            >
              Semua status <span>⌄</span>
            </Button>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <Table className="min-w-[760px] text-left">
              <TableHeader className="bg-muted text-muted-foreground">
                <TableRow className="hover:bg-transparent font-bold">
                  <TableHead className="px-4 py-3 font-semibold">
                    Nama sesi
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    ID sesi
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Kode akses
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Dibuat
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Berakhir
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Memuat sesi...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && errorMessage && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-destructive"
                    >
                      {errorMessage}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !errorMessage && sessions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Belum ada sesi.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  !errorMessage &&
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="px-4 py-3.5 font-medium text-foreground">
                        <Link
                          href={`/dashboard/session/${session.id}`}
                          className="transition-colors hover:text-primary hover:underline"
                        >
                          {session.title}
                        </Link>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span className="font-semibold text-foreground">
                          {session.id}
                        </span>
                        <Button variant="ghost" size="icon-xs" className="ml-2">
                          <IconCopy className="size-3 text-muted-foreground" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span className="font-semibold text-foreground">
                          {session.access_code}
                        </span>
                        <Button variant="ghost" size="icon-xs" className="ml-2">
                          <IconCopy className="size-3 text-muted-foreground" />
                        </Button>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(session.created_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(session.ended_at)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <span
                          className={
                            session.status === "active"
                              ? "rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                              : "rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                          }
                        >
                          {session.status === "active" ? "Aktif" : "Selesai"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <Button variant="ghost" size="icon-xs">
                          <IconDotsVertical className="size-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default DashboardPage;
