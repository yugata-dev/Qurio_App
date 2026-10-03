"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  IconAlertTriangle,
  IconAward,
  IconDownload,
  IconInfoCircle,
  IconMoodEmpty,
  IconRefresh,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getAnalyticsScoreTrend,
  getAnalyticsScores,
  getAnalyticsStudents,
  getAnalyticsSummary,
  getAnalyticsTopics,
  type AnalyticsSummary,
  type ScoreTrendPeriod,
  type ScoreTrendPoint,
  type StudentParticipation,
  type StudentScore,
  type TopTopic,
} from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const TREND_RANGES: { value: ScoreTrendPeriod; label: string }[] = [
  { value: "7d", label: "7 hari" },
  { value: "14d", label: "14 hari" },
  { value: "30d", label: "30 hari" },
];

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

const scoreTrendConfig = {
  avgScore: { label: "Skor rata-rata", color: "var(--chart-2)" },
} satisfies ChartConfig;

const trendDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const topicsConfig = {
  incorrectRate: { label: "Jawaban salah", color: "var(--chart-4)" },
} satisfies ChartConfig;

// -------------------------------------------------------------
// Komponen kecil yang dapat dipakai ulang
// -------------------------------------------------------------

/** Empty state standar untuk chart/tabel yang belum punya data. */
function EmptyBlock({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-xl bg-muted/40 px-6 py-10 text-center">
      <div className="flex max-w-sm flex-col items-center gap-2">
        <span className="grid size-11 place-items-center rounded-full bg-background text-muted-foreground">
          {icon ?? <IconMoodEmpty className="size-5" />}
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Warna progress bar berdasarkan tingkat kehadiran.
 * >=80% hijau, >=60% kuning, <60% merah.
 */
function getAttendanceColor(rate: number) {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getActivityStatus(responseCount: number) {
  if (responseCount >= 40) {
    return {
      label: "🌟 Sangat Aktif",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (responseCount >= 25) {
    return {
      label: "✅ Aktif",
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (responseCount >= 10) {
    return {
      label: "⚠️ Kurang Aktif",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "❌ Pasif",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  };
}

function getScoreStatus(
  score: number,
  sessionCount: number,
  sessionsJoined: number,
) {
  if (score >= 80 && sessionCount >= 5) {
    return {
      label: "🏆 Top Performer",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (sessionsJoined >= 7 && score < 70) {
    return {
      label: "💪 Rajin, nilai perlu ditingkatkan",
      className: "border-blue-500/20 bg-blue-500/15 text-blue-700 dark:text-blue-400",
    };
  }
  if (score >= 80) {
    return {
      label: "📊 Data terbatas",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  if (score >= 70) {
    return {
      label: "✅ Baik",
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (score >= 60) {
    return {
      label: "⚠️ Perlu Bimbingan",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "🚨 Perlu Perhatian",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  };
}

interface StudentScoreProfile {
  studentKey: string;
  studentName: string;
  average: number;
  sessionCount: number;
  standardDeviation: number;
}

interface Insight {
  icon: string;
  text: string;
}

function getStudentScoreProfiles(scores: StudentScore[]): StudentScoreProfile[] {
  const totals = new Map<
    string,
    { studentName: string; scores: number[] }
  >();

  scores.forEach((score) => {
    const student = totals.get(score.studentKey) ?? {
      studentName: score.studentName,
      scores: [],
    };
    student.scores.push(score.score);
    totals.set(score.studentKey, student);
  });

  return [...totals.entries()].map(([studentKey, student]) => {
    const scoreTotal = student.scores.reduce((total, score) => total + score, 0);
    const average = scoreTotal / student.scores.length;
    const variance =
      student.scores.reduce(
        (total, score) => total + (score - average) ** 2,
        0,
      ) / student.scores.length;

    return {
      studentKey,
      studentName: student.studentName,
      average: Math.round(average),
      sessionCount: student.scores.length,
      standardDeviation: Math.sqrt(variance),
    };
  });
}

function generateInsights({
  summary,
  studentScores,
  studentParticipation,
  totalSessions,
}: {
  summary: AnalyticsSummary;
  studentScores: StudentScore[];
  studentParticipation: StudentParticipation[];
  totalSessions: number;
}): Insight[] {
  const insights: Insight[] = [];
  const activeStudents = studentParticipation.filter(
    (student) => student.responsesSubmitted > 0,
  ).length;
  const totalStudents = summary.totalStudents;
  const participationPct = totalStudents
    ? (activeStudents / totalStudents) * 100
    : 0;

  if (totalStudents > 0) {
    if (participationPct >= 90) {
      insights.push({
        icon: "✅",
        text: `Partisipasi sangat baik — hampir semua siswa (${activeStudents} dari ${totalStudents}) terlibat aktif di kelas.`,
      });
    } else if (participationPct >= 70) {
      insights.push({
        icon: "📊",
        text: `Partisipasi cukup baik — ${activeStudents} dari ${totalStudents} siswa terlibat. Beberapa siswa masih perlu didorong untuk aktif.`,
      });
    } else {
      insights.push({
        icon: "⚠️",
        text: `Partisipasi perlu ditingkatkan — hanya ${activeStudents} dari ${totalStudents} siswa yang aktif. Pertimbangkan strategi untuk meningkatkan keterlibatan.`,
      });
    }
  }

  const averageScore = Math.round(summary.averageScore);
  if (averageScore >= 80) {
    insights.push({
      icon: "🏆",
      text: `Nilai rata-rata kelas ${averageScore}% — pemahaman materi sangat baik.`,
    });
  } else if (averageScore >= 70) {
    insights.push({
      icon: "✅",
      text: `Nilai rata-rata kelas ${averageScore}% — sudah di atas standar, pertahankan atau tingkatkan.`,
    });
  } else if (averageScore >= 60) {
    insights.push({
      icon: "📊",
      text: `Nilai rata-rata kelas ${averageScore}% — masih di batas aman, perlu penguatan di beberapa topik.`,
    });
  } else {
    insights.push({
      icon: "⚠️",
      text: `Nilai rata-rata kelas ${averageScore}% — di bawah standar. Pertimbangkan untuk mengulang materi yang sulit.`,
    });
  }

  const scoreProfiles = getStudentScoreProfiles(studentScores).sort(
    (first, second) => second.average - first.average,
  );
  const topPerformer = scoreProfiles[0];
  if (topPerformer) {
    insights.push({
      icon: "🌟",
      text: `${topPerformer.studentName} adalah siswa terbaik — rata-rata ${topPerformer.average}% dari ${topPerformer.sessionCount} sesi kuis yang diikuti.`,
    });
  }

  const participationByKey = new Map(
    studentParticipation.map((student) => [student.studentKey, student]),
  );
  const hardworkingStudents = scoreProfiles.filter((student) => {
    const participation = participationByKey.get(student.studentKey);
    return participation !== undefined &&
      participation.sessionsJoined >= 7 &&
      student.average < 70;
  });
  if (hardworkingStudents.length === 1) {
    const student = hardworkingStudents[0];
    const participation = participationByKey.get(student.studentKey);
    insights.push({
      icon: "💪",
      text: `${student.studentName} sangat rajin hadir (${participation?.sessionsJoined} sesi), tapi nilainya masih ${student.average}%. Perlu pendekatan berbeda untuk membantunya memahami materi.`,
    });
  } else if (hardworkingStudents.length <= 3 && hardworkingStudents.length > 1) {
    insights.push({
      icon: "💪",
      text: `${hardworkingStudents.length} siswa rajin hadir tapi nilainya perlu ditingkatkan: ${hardworkingStudents.map((student) => student.studentName).join(", ")}. Mereka sudah berusaha, mungkin butuh pendampingan tambahan.`,
    });
  } else if (hardworkingStudents.length > 3) {
    insights.push({
      icon: "💪",
      text: `Ada ${hardworkingStudents.length} siswa yang rajin hadir tapi nilainya di bawah standar. Perlu perhatian khusus untuk kelompok ini.`,
    });
  }

  const highScoringLowAttendance = scoreProfiles.find((student) => {
    const participation = participationByKey.get(student.studentKey);
    return participation !== undefined &&
      participation.sessionsJoined <= 5 &&
      student.average >= 75;
  });
  if (highScoringLowAttendance) {
    const participation = participationByKey.get(highScoringLowAttendance.studentKey);
    insights.push({
      icon: "🎯",
      text: `${highScoringLowAttendance.studentName} memiliki nilai bagus (${highScoringLowAttendance.average}%), tapi hanya hadir di ${participation?.sessionsJoined} dari ${totalSessions} sesi. Cek apakah ada kendala kehadiran.`,
    });
  }

  const studentsNeedingAttention = new Set([
    ...scoreProfiles
      .filter((student) => student.average < 60)
      .map((student) => student.studentKey),
    ...studentParticipation
      .filter((student) => student.sessionsJoined < 4)
      .map((student) => student.studentKey),
  ]);
  if (studentsNeedingAttention.size > 0) {
    insights.push({
      icon: "🚨",
      text: `${studentsNeedingAttention.size} siswa perlu perhatian khusus — nilainya rendah atau kehadirannya jarang. Lihat tab 'Perlu Perhatian' untuk detail.`,
    });
  }

  return insights;
}

function getQuizCoverage(sessionCount: number, totalSessions: number) {
  if (totalSessions > 0 && sessionCount >= totalSessions - 1) {
    return {
      label: "Konsisten",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (sessionCount >= Math.ceil(totalSessions / 2)) {
    return {
      label: "Cukup",
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "Data terbatas",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  };
}

// -------------------------------------------------------------
// Halaman utama
// -------------------------------------------------------------
function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [studentParticipation, setStudentParticipation] = useState<
    StudentParticipation[]
  >([]);
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [scoreTrend, setScoreTrend] = useState<ScoreTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [trendRange, setTrendRange] = useState<ScoreTrendPeriod>("7d");
  const [leaderboardTab, setLeaderboardTab] = useState<
    "active" | "top-score" | "attention"
  >("active");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const requestRef = useRef(false);

  const loadSessions = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (requestRef.current) return;

      requestRef.current = true;
      if (force) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [summaryResult, scoresResult, studentsResult, topicsResult, trendResult] =
          await Promise.allSettled([
            getAnalyticsSummary("all"),
            getAnalyticsScores("all"),
            getAnalyticsStudents("all"),
            getAnalyticsTopics("all", 5),
            getAnalyticsScoreTrend(trendRange),
          ] as const);

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        }
        if (scoresResult.status === "fulfilled") {
          setStudentScores(scoresResult.value);
        }
        if (studentsResult.status === "fulfilled") {
          setStudentParticipation(studentsResult.value);
        }
        if (topicsResult.status === "fulfilled") {
          setTopTopics(topicsResult.value);
        }
        if (trendResult.status === "fulfilled") {
          setScoreTrend(trendResult.value);
        }

        const failures: string[] = [];
        if (summaryResult.status === "rejected") failures.push("ringkasan");
        if (scoresResult.status === "rejected") failures.push("skor");
        if (studentsResult.status === "rejected") {
          failures.push("partisipasi siswa");
        }
        if (topicsResult.status === "rejected") {
          failures.push("topik tersulit");
        }
        if (trendResult.status === "rejected") {
          failures.push("tren skor kuis");
        }

        const stamp = Date.now();
        setFetchedAt(stamp);
        setErrorMessage(
          failures.length > 0
            ? `Sebagian data tidak dapat dimuat: ${failures.join(", ")}.`
            : null,
        );
      } finally {
        requestRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [trendRange],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSessions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSessions]);

  const hasScoreTrendData = scoreTrend.some(
    (point) => point.totalResponses > 0,
  );

  const scoreByStudent = useMemo(
    () =>
      new Map(
        getStudentScoreProfiles(studentScores).map((student) => [
          student.studentKey,
          student,
        ]),
      ),
    [studentScores],
  );

  const topScoreLeaderboard = useMemo(
    () => {
      const ranked = [...scoreByStudent.entries()]
        .map(([studentKey, student]) => ({
          studentKey,
          studentName: student.studentName,
          average: student.average,
          sessionCount: student.sessionCount,
          standardDeviation: student.standardDeviation,
        }))
        .sort((first, second) => second.average - first.average);

      return ranked.map((student) => ({
        ...student,
        belowPercent:
          ranked.length > 1
            ? Math.round(
              (ranked.filter((other) => other.average < student.average).length /
                (ranked.length - 1)) *
              100,
            )
            : 0,
      }));
    },
    [scoreByStudent],
  );

  const activeLeaderboard = useMemo(
    () =>
      [...studentParticipation]
        .sort(
          (first, second) =>
            second.sessionsJoined + second.questionsAsked + second.responsesSubmitted -
            (first.sessionsJoined + first.questionsAsked + first.responsesSubmitted),
        ),
    [studentParticipation],
  );

  const activitySummary = useMemo(() => {
    const activityCount = (student: StudentParticipation) =>
      student.sessionsJoined + student.questionsAsked + student.responsesSubmitted;
    const average = studentParticipation.length
      ? Math.round(
        studentParticipation.reduce(
          (total, student) => total + activityCount(student),
          0,
        ) / studentParticipation.length,
      )
      : 0;
    const topFive = [...studentParticipation]
      .sort((first, second) => activityCount(second) - activityCount(first))
      .slice(0, 5);
    const topFiveAverage = topFive.length
      ? Math.round(
        topFive.reduce((total, student) => total + activityCount(student), 0) /
        topFive.length,
      )
      : 0;

    return { studentCount: studentParticipation.length, average, topFiveAverage };
  }, [studentParticipation]);

  const scoreSummary = useMemo(() => {
    const scores = [...scoreByStudent.values()].map((student) => student.average);
    if (scores.length === 0) return null;

    return {
      studentCount: scores.length,
      average: Math.round(scores.reduce((total, score) => total + score, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    };
  }, [scoreByStudent]);

  const insights = useMemo(
    () =>
      summary
        ? generateInsights({
          summary,
          studentScores,
          studentParticipation,
          totalSessions: summary.totalSessions,
        })
        : [],
    [summary, studentScores, studentParticipation],
  );

  const attentionLeaderboard = useMemo(() => {
    const studentsByKey = new Map(
      studentParticipation.map((student) => [
        student.studentKey,
        {
          ...student,
          scoreProfile: scoreByStudent.get(student.studentKey),
        },
      ]),
    );

    for (const profile of scoreByStudent.values()) {
      if (!studentsByKey.has(profile.studentKey)) {
        studentsByKey.set(profile.studentKey, {
          studentKey: profile.studentKey,
          studentName: profile.studentName,
          sessionsJoined: 0,
          questionsAsked: 0,
          responsesSubmitted: 0,
          scoreProfile: profile,
        });
      }
    }

    const totalSessions = summary?.totalSessions ?? 0;
    return [...studentsByKey.values()]
      .flatMap((student) => {
        const averageScore = student.scoreProfile?.average ?? null;
        const lowScore = averageScore !== null && averageScore < 60;
        const lowAttendance = student.sessionsJoined < 4;
        const lowResponses = student.responsesSubmitted < 15;
        if (!lowScore && !lowAttendance && !lowResponses) return [];

        const reasons: string[] = [];
        if (lowScore) reasons.push(`🚨 Nilai rendah (${averageScore}%)`);
        if (lowAttendance) {
          reasons.push(
            `⚠️ Kehadiran rendah (${student.sessionsJoined} dari ${totalSessions} sesi)`,
          );
        }
        if (lowResponses) {
          reasons.push(`💬 Jarang menjawab (${student.responsesSubmitted} respons)`);
        }

        let recommendation = "Dorong siswa untuk lebih aktif menjawab";
        if (lowScore && lowAttendance) {
          recommendation = "Prioritaskan — cek kendala belajar & kehadiran";
        } else if (lowScore) {
          recommendation = "Beri pendampingan belajar tambahan";
        } else if (lowAttendance) {
          recommendation = "Cek kendala kehadiran, follow up orang tua";
        } else if (
          student.sessionsJoined >= 7 &&
          averageScore !== null &&
          averageScore < 70
        ) {
          recommendation = "Coba metode pengajaran berbeda untuk siswa ini";
        }

        const severity = lowScore && lowAttendance
          ? 1
          : lowScore
            ? 2
            : lowAttendance
              ? 3
              : 4;

        return [{
          ...student,
          averageScore,
          reason: reasons.join(" · "),
          recommendation,
          severity,
        }];
      })
      .sort(
        (first, second) =>
          first.severity - second.severity ||
          (first.averageScore ?? 101) - (second.averageScore ?? 101) ||
          first.responsesSubmitted - second.responsesSubmitted,
      );
  }, [studentParticipation, scoreByStudent, summary?.totalSessions]);

  // ---- Export CSV ----
  const handleExportCSV = () => {
    if (!studentScores.length && !studentParticipation.length) {
      toast.add({
        title: "Belum ada data untuk diekspor",
        description:
          "Data performa siswa belum tersedia. Jalankan kuis dan minta siswa menjawab.",
        type: "info",
      });
      return;
    }

    const rows: string[] = [];
    rows.push(
      "student_name,sessions_joined,questions_asked,responses_submitted,average_score",
    );

    const scoreByStudentName = new Map(
      [...scoreByStudent.entries()].map(([studentKey, student]) => [
        studentKey,
        student.average,
      ]),
    );

    studentParticipation.forEach((p) => {
      rows.push(
        [
          `"${p.studentName.replaceAll('"', '""')}"`,
          p.sessionsJoined,
          p.questionsAsked,
          p.responsesSubmitted,
          scoreByStudentName.get(p.studentKey) ?? "",
        ].join(","),
      );
    });

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qurio-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.add({
      title: "Laporan berhasil diunduh",
      description: "File CSV berisi data performa siswa.",
      type: "success",
    });
  };

  // ---- Kartu ringkasan ----
  const overviewItems: {
    label: string;
    value: string;
    detail: string;
    compact?: boolean;
  }[] = [
      {
        label: "Total Siswa",
        value: summary ? String(summary.totalStudents) : "-",
        detail: "Siswa unik di seluruh sesi",
      },
      {
        label: "Rata-rata Skor Kuis",
        value: summary ? `${Math.round(summary.averageScore)}%` : "-",
        detail:
          summary
            ? `Dari ${studentScores.length} rekap siswa-sesi`
            : "Menunggu data jawaban kuis",
      },
      {
        label: "Tingkat Kehadiran",
        value: summary ? `${Math.round(summary.attendanceRate)}%` : "-",
        detail: summary
          ? `${summary.sessionsWithClassSize} dari ${summary.totalSessions} sesi terukur`
          : "Menunggu data kehadiran",
      },
      {
        label: "Sesi Dianalisis",
        value: summary ? String(summary.totalSessions) : "-",
        detail: summary
          ? `${summary.sessionsWithClassSize} dari ${summary.totalSessions} sesi punya data kelas`
          : "Memuat...",
      },
    ];

  return (
    <section className="mx-auto w-full max-w-[1180px] p-6 lg:p-8">
      {/* Header + tombol ekspor. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-foreground">
            Analitik Performa Siswa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ukur pemahaman, partisipasi, dan capaian belajar siswa di seluruh
            sesi Qurio Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || isRefreshing}
            onClick={() => void loadSessions({ force: true })}
          >
            <IconRefresh
              className={cn(
                "size-4",
                (isLoading || isRefreshing) && "animate-spin",
              )}
            />
            Muat ulang
          </Button>
          <Button size="sm" onClick={handleExportCSV}>
            <IconDownload className="size-4" />
            Ekspor CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-label="Ekspor PDF"
          >
            <IconDownload className="size-4" />
            Ekspor PDF
          </Button>
        </div>
      </header>

      {/* Error state. */}
      {errorMessage && (
        <Alert variant="destructive" className="mt-6">
          <IconAlertTriangle />
          <AlertTitle>Data analitik tidak dapat dimuat</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
          <AlertAction>
            <Button
              variant="outline"
              size="xs"
              onClick={() => void loadSessions({ force: true })}
            >
              Coba lagi
            </Button>
          </AlertAction>
        </Alert>
      )}

      {/* Kartu metrik utama. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewItems.map(({ label, value, detail, compact }) => (
          <Card
            key={label}
            className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none"
          >
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[13px] font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-2 p-5 pt-2">
              {isLoading ? (
                <Skeleton className="h-8 w-28 rounded-lg" />
              ) : (
                <p
                  className={cn(
                    "font-bold tracking-tight text-foreground",
                    compact ? "text-[22px] leading-8" : "text-[28px]",
                  )}
                >
                  {value}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ringkasan insight kelas berbasis aturan. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            💡 Ringkasan Kelas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading || !summary || (studentScores.length === 0 && studentParticipation.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              Insight akan muncul setelah ada data kuis dan partisipasi.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {insights.map((insight, index) => (
                <li
                  key={`${index}-${insight.icon}`}
                  className="flex items-start gap-2 text-sm leading-relaxed text-foreground"
                >
                  <span aria-hidden="true" className="shrink-0">
                    {insight.icon}
                  </span>
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Panel: Kehadiran per Sesi (breakdown). */}
      {summary &&
        summary.attendanceBreakdown &&
        summary.attendanceBreakdown.length > 0 && (
          <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
            <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
              <CardTitle className="text-base font-semibold text-foreground">
                Kehadiran per Sesi
              </CardTitle>
              <CardDescription>
                Sesi dengan kehadiran terendah ditampilkan lebih dulu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
              <ul className="flex flex-col gap-1">
                {summary.attendanceBreakdown.map((item) => (
                  <li
                    key={item.sessionId}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2 w-24 overflow-hidden rounded-full bg-muted"
                      >
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            getAttendanceColor(item.rate),
                          )}
                          style={{ width: `${item.rate}%` }}
                        />
                      </span>
                      <span className="w-16 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {item.joined}/{item.classSize}
                      </span>
                      <span className="w-12 text-right text-sm font-bold tabular-nums text-foreground">
                        {Math.round(item.rate)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {/* Tren skor kuis harian. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            Tren Skor Kuis Harian
          </CardTitle>
          <CardDescription>
            Persentase jawaban benar dari seluruh respons kuis harian
          </CardDescription>
          <CardAction>
            <Tabs
              value={trendRange}
              onValueChange={(value) =>
                setTrendRange(value as ScoreTrendPeriod)
              }
              className="w-auto gap-0"
            >
              <TabsList className="h-8 w-fit gap-1 rounded-full border-b-0 bg-muted px-1 py-1">
                {TREND_RANGES.map((range) => (
                  <TabsTrigger
                    key={range.value}
                    value={range.value}
                    className="h-6 rounded-full border-b-0 px-3 text-xs data-active:border-transparent data-active:bg-background data-active:text-foreground"
                  >
                    {range.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : hasScoreTrendData ? (
            <ChartContainer
              config={scoreTrendConfig}
              className="h-56 w-full aspect-auto"
            >
              <AreaChart
                data={scoreTrend}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: string) =>
                    trendDateFormatter.format(new Date(`${date}T12:00:00Z`))
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={12}
                />
                <YAxis
                  domain={[0, 100]}
                  allowDecimals={false}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="var(--color-avgScore)"
                  fill="var(--color-avgScore)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyBlock
              title="Belum ada skor kuis pada rentang ini"
              description="Belum ada respons kuis yang dinilai pada rentang tanggal ini."
              icon={<IconTrendingUp className="size-5" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Topik tersulit berdasarkan persentase jawaban salah. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            Topik Paling Sulit
          </CardTitle>
          <CardDescription>
            Persentase jawaban salah per soal kuis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : topTopics.length > 0 ? (
            <ChartContainer
              config={topicsConfig}
              className="h-72 w-full aspect-auto"
            >
              <BarChart
                data={topTopics.slice(0, 5)}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="questionText"
                  tickLine={false}
                  axisLine={false}
                  width={220}
                  tickFormatter={(value: string) =>
                    value.length > 40 ? `${value.slice(0, 40)}…` : value
                  }
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="incorrectRate"
                  fill="var(--color-incorrectRate)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyBlock
              title="Belum ada topik tersulit"
              description="Topik muncul setelah minimal lima jawaban tercatat untuk satu soal kuis."
            />
          )}
        </CardContent>
      </Card>

      {/* Leaderboard global siswa. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="grid-cols-1 p-5 pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6 sm:pb-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {leaderboardTab === "active"
                  ? "Siswa Paling Aktif"
                  : leaderboardTab === "top-score"
                    ? "Siswa dengan Nilai Terbaik"
                    : "Siswa yang Perlu Perhatian"}
              </CardTitle>
              {leaderboardTab !== "attention" && (
                <LeaderboardInfo mode={leaderboardTab} />
              )}
            </div>
            <CardDescription className="mt-1 max-w-2xl">
              {leaderboardTab === "active"
                ? "Diurutkan berdasarkan jumlah aktivitas: bergabung sesi, bertanya, dan menjawab. Cocok untuk melihat siapa yang paling terlibat di kelas."
                : leaderboardTab === "top-score"
                  ? "Diurutkan berdasarkan rata-rata nilai kuis. Cocok untuk melihat siapa yang paling paham materi."
                  : "Siswa diurutkan berdasarkan nilai, kehadiran, dan respons yang perlu ditindaklanjuti."}
            </CardDescription>
          </div>
          <div className="col-start-1 row-start-2 justify-self-start sm:col-start-2 sm:row-start-1 sm:justify-self-end">
            <Tabs
              value={leaderboardTab}
              onValueChange={(value) => {
                setLeaderboardTab(value as "active" | "top-score" | "attention");
                setShowAllLeaderboard(false);
              }
              }
              className="w-auto gap-0"
            >
              <TabsList className="h-8 w-fit gap-1 rounded-full border-b-0 bg-muted px-1 py-1">
                <TabsTrigger
                  value="active"
                  className="h-6 rounded-full border-b-0 px-3 text-xs data-active:border-transparent data-active:bg-background data-active:text-foreground"
                >
                  Paling Aktif
                </TabsTrigger>
                <TabsTrigger
                  value="top-score"
                  className="h-6 rounded-full border-b-0 px-3 text-xs data-active:border-transparent data-active:bg-background data-active:text-foreground"
                >
                  Skor Tertinggi
                </TabsTrigger>
                <TabsTrigger
                  value="attention"
                  className="h-6 rounded-full border-b-0 px-3 text-xs data-active:border-transparent data-active:bg-background data-active:text-foreground"
                >
                  ⚠️ Perlu Perhatian
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : leaderboardTab === "active" ? (
            activeLeaderboard.length > 0 ? (
              <>
                <div className="mb-4 border-b border-border pb-4">
                  <p className="text-sm font-medium text-foreground">
                    📊 {activitySummary.studentCount} siswa terlibat · Rata-rata {activitySummary.average} aktivitas/siswa · Top 5 rata-rata {activitySummary.topFiveAverage} aktivitas
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gunakan daftar ini untuk mengenali siswa yang perlu diajak lebih aktif.
                  </p>
                </div>
                <LeaderboardTable
                  mode="active"
                  rows={(showAllLeaderboard ? activeLeaderboard : activeLeaderboard.slice(0, 10)).map((row, index) => {
                    const status = getActivityStatus(row.responsesSubmitted);
                    const activityCount =
                      row.sessionsJoined +
                      row.questionsAsked +
                      row.responsesSubmitted;

                    return {
                      rank: index + 1,
                      name: row.studentName,
                      detail: `${row.sessionsJoined} sesi · ${row.questionsAsked} tanya · ${row.responsesSubmitted} jawaban`,
                      value: `${activityCount} aktivitas`,
                      statusLabel: status.label,
                      statusClassName: status.className,
                    };
                  })}
                />
                {activeLeaderboard.length > 10 && (
                  <LeaderboardToggle
                    total={activeLeaderboard.length}
                    expanded={showAllLeaderboard}
                    onToggle={() => setShowAllLeaderboard((current) => !current)}
                  />
                )}
              </>
            ) : (
              <EmptyBlock
                title="Belum ada data aktivitas siswa"
                description="Papan peringkat ini akan terisi setelah siswa bergabung ke sesi dan menjawab kuis. Ajak siswa untuk aktif di kelas ya!"
                icon={<IconUsers className="size-5" />}
              />
            )
          ) : leaderboardTab === "top-score" && topScoreLeaderboard.length > 0 ? (
            <>
              {scoreSummary && (
                <div className="mb-4 border-b border-border pb-4">
                  <p className="text-sm font-medium text-foreground">
                    📊 {scoreSummary.studentCount} siswa dinilai · Rata-rata kelas {scoreSummary.average}% · Tertinggi {scoreSummary.highest}% · Terendah {scoreSummary.lowest}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gunakan hasil ini untuk memberi pengayaan atau menentukan siswa yang perlu pendampingan.
                  </p>
                </div>
              )}
              <LeaderboardTable
                mode="top-score"
                rows={(showAllLeaderboard ? topScoreLeaderboard : topScoreLeaderboard.slice(0, 10)).map((row, index) => {
                  const totalSessions = summary?.totalSessions ?? row.sessionCount;
                  const coverage = getQuizCoverage(row.sessionCount, totalSessions);
                  const status = getScoreStatus(
                    row.average,
                    row.sessionCount,
                    studentParticipation.find(
                      (student) => student.studentKey === row.studentKey,
                    )?.sessionsJoined ?? 0,
                  );

                  return {
                    rank: index + 1,
                    name: row.studentName,
                    detail: `Dari ${row.sessionCount} sesi berkuis · nilai ${row.standardDeviation <= 10 ? "konsisten" : "bervariasi"} · lebih baik dari ${row.belowPercent}% siswa`,
                    coverageLabel: `${row.sessionCount}/${totalSessions} sesi · ${coverage.label}`,
                    coverageClassName: coverage.className,
                    value: `${row.average}%`,
                    statusLabel: status.label,
                    statusClassName: status.className,
                  };
                })}
              />
              {topScoreLeaderboard.length > 10 && (
                <LeaderboardToggle
                  total={topScoreLeaderboard.length}
                  expanded={showAllLeaderboard}
                  onToggle={() => setShowAllLeaderboard((current) => !current)}
                />
              )}
            </>
          ) : leaderboardTab === "top-score" ? (
            <EmptyBlock
              title="Belum ada nilai kuis"
              description="Peringkat ini akan muncul setelah siswa menjawab minimal satu kuis. Pastikan guru sudah menjalankan kuis di sesi kelas."
              icon={<IconAward className="size-5" />}
            />
          ) : attentionLeaderboard.length > 0 ? (
            <LeaderboardTable
              mode="attention"
              rows={attentionLeaderboard.slice(0, 10).map((student, index) => ({
                rank: index + 1,
                name: student.studentName,
                detail: `${student.sessionsJoined} dari ${summary?.totalSessions ?? 0} sesi · ${student.responsesSubmitted} respons`,
                value: "",
                statusLabel: "",
                statusClassName: "",
                reason: student.reason,
                recommendation: student.recommendation,
              }))}
            />
          ) : (
            <div className="grid min-h-50 place-items-center rounded-xl border border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="max-w-sm">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  🎉 Semua siswa dalam kondisi baik
                </p>
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  Tidak ada siswa yang butuh perhatian khusus saat ini. Kelas Anda luar biasa!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

// -------------------------------------------------------------
// Sub-komponen: tabel leaderboard ringkas.
// -------------------------------------------------------------
interface LeaderboardRow {
  rank: number;
  name: string;
  detail: string;
  coverageLabel?: string;
  coverageClassName?: string;
  value: string;
  statusLabel: string;
  statusClassName: string;
  reason?: string;
  recommendation?: string;
}

function LeaderboardToggle({
  total,
  expanded,
  onToggle,
}: {
  total: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-3 flex justify-center">
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {expanded
          ? "Tampilkan lebih sedikit ↑"
          : `Lihat semua ${total} siswa →`}
      </Button>
    </div>
  );
}

function LeaderboardInfo({ mode }: { mode: "active" | "top-score" }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          type="button"
          aria-label={
            mode === "active"
              ? "Cara menghitung aktivitas siswa"
              : "Cara membaca rata-rata nilai kuis"
          }
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <IconInfoCircle aria-hidden="true" className="size-4" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner side="top" sideOffset={8}>
            <Tooltip.Popup className="z-50 max-w-xs rounded-md bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg">
              {mode === "active" ? (
                <>
                  Aktivitas = jumlah kehadiran sesi + jumlah pertanyaan + jumlah
                  jawaban. Semakin tinggi, semakin aktif siswa di kelas.
                </>
              ) : (
                <>
                  Rata-rata adalah rata-rata persentase jawaban benar dari sesi
                  kuis yang diikuti. Semakin tinggi, semakin paham materi.
                  Simpangan baku di bawah 10 poin ditandai konsisten. Siswa
                  dengan kurang dari 3 sesi berkuis mungkin memiliki hasil yang
                  kurang akurat.
                </>
              )}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function LeaderboardTable({
  rows,
  mode,
}: {
  rows: LeaderboardRow[];
  mode: "active" | "top-score" | "attention";
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader className="bg-muted text-muted-foreground">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-3 py-2 text-center font-semibold">
              #
            </TableHead>
            {mode === "attention" ? (
              <>
                <TableHead className="px-3 py-2 font-semibold">Siswa</TableHead>
                <TableHead className="px-3 py-2 font-semibold">Alasan</TableHead>
                <TableHead className="px-3 py-2 font-semibold">Tindakan</TableHead>
              </>
            ) : (
              <>
                <TableHead className="px-3 py-2 font-semibold">Siswa dan detail</TableHead>
                <TableHead className="px-3 py-2 font-semibold">Status</TableHead>
                <TableHead className="px-3 py-2 text-right font-semibold">
                  {mode === "active" ? "Aktivitas" : "Nilai"}
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.rank}-${row.name}`}>
              <TableCell className="px-3 py-3 text-center text-base font-semibold text-muted-foreground">
                <span aria-label={`Peringkat ${row.rank}`}>
                  {row.rank === 1
                    ? "🥇"
                    : row.rank === 2
                      ? "🥈"
                      : row.rank === 3
                        ? "🥉"
                        : row.rank}
                </span>
              </TableCell>
              {mode === "attention" ? (
                <>
                  <TableCell className="min-w-40 px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                    <p className="text-[11px] text-muted-foreground">{row.detail}</p>
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal px-3 py-3 text-xs leading-relaxed text-foreground">
                    {row.reason}
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal px-3 py-3 text-xs leading-relaxed text-muted-foreground">
                    {row.recommendation}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="min-w-56 px-3 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {row.name}
                    </p>
                    <p className="whitespace-normal text-[11px] leading-relaxed text-muted-foreground">
                      {row.detail}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <Badge variant="outline" className={row.statusClassName}>
                      {row.statusLabel}
                    </Badge>
                    {row.coverageLabel && (
                      <Badge
                        variant="outline"
                        className={cn("mt-1 ml-2", row.coverageClassName)}
                      >
                        📊 {row.coverageLabel}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right text-base font-bold tabular-nums text-foreground">
                    {row.value}
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AnalyticsPage;
