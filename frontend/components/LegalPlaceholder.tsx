import Image from "next/image";
import Link from "next/link";

export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" aria-label="Qurio beranda" className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
          <Image src="/Qurio-Cropped.svg" alt="Qurio" width={100} height={48} priority className="h-auto w-24" />
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
          Kembali ke beranda
        </Link>
      </div>

      <section className="mx-auto mt-16 w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:mt-24 sm:p-10">
        <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
          Halaman sementara
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Informasi {title.toLowerCase()} Qurio sedang disiapkan. Halaman ini akan diperbarui setelah ketentuannya ditinjau.
        </p>
        <Link href="/" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-500 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
          Kembali ke beranda
        </Link>
      </section>
    </main>
  );
}
