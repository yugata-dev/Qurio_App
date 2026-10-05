"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChartBar, IconMessages } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const tabs = [
    {
        href: "/analytics/quiz",
        label: "Performa Quiz",
        Icon: IconChartBar,
    },
    {
        href: "/analytics/interactive",
        label: "Engagement Interaktif",
        Icon: IconMessages,
    },
];

export default function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
                    Analitik Kelas
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Pantau pemahaman dan keaktifan siswa di seluruh sesi kelas Anda
                </p>
            </header>

            <nav
                aria-label="Halaman analitik"
                className="mb-6 flex gap-1 border-b border-border"
            >
                {tabs.map((tab) => {
                    const active =
                        pathname === tab.href || pathname.startsWith(`${tab.href}/`);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
                                active
                                    ? "border-primary text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <tab.Icon aria-hidden="true" className="size-4" />
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {children}
        </section>
    );
}