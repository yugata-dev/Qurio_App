"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconAward,
  IconBarbell,
  IconBulb,
  IconCircleCheck,
  IconCircleX,
  IconConfetti,
  IconDownload,
  IconInfoCircle,
  IconMoodEmpty,
  IconStar,
  IconTrophy,
  IconRefresh,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
  getAnalyticsScoreBySession,
  getAnalyticsScores,
  getAnalyticsStudents,
  getAnalyticsSummary,
  getAnalyticsTopics,
  type AnalyticsSummary,
  type ScoreBySessionPoint,
  type StudentParticipation,
  type StudentScore,
  type TopTopic,
} from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/context/AuthContext";
import { exportAnalyticsPDF } from "@/lib/export-pdf";
import { cn } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

const scoreBySessionConfig = {
  avgScore: { label: "Skor rata-rata", color: "var(--chart-2)" },
  totalAnswers: { label: "Jawaban dinilai" },
} satisfies ChartConfig;

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
      label: "Sangat Aktif",
      Icon: IconStar,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (responseCount >= 25) {
    return {
      label: "Aktif",
      Icon: IconCircleCheck,
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (responseCount >= 10) {
    return {
      label: "Kurang Aktif",
      Icon: IconAlertTriangle,
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "Pasif",
    Icon: IconCircleX,
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
      label: "Top Performer",
      Icon: IconTrophy,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (sessionsJoined >= 7 && score < 70) {
    return {
      label: "Rajin, nilai perlu ditingkatkan",
      Icon: IconBarbell,
      className: "border-blue-500/20 bg-blue-500/15 text-blue-700 dark:text-blue-400",
    };
  }
  if (score >= 80) {
    return {
      label: "Data terbatas",
      Icon: IconInfoCircle,
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  if (score >= 70) {
    return {
      label: "Baik",
      Icon: IconCircleCheck,
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (score >= 60) {
    return {
      label: "Perlu Bimbingan",
      Icon: IconAlertTriangle,
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "Perlu Perhatian",
    Icon: IconAlertOctagon,
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

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function generateNarrative({
  summary,
  studentScores,
  studentParticipation,
  totalSessions,
  attentionLeaderboard,
}: {
  summary: AnalyticsSummary;
  studentScores: StudentScore[];
  studentParticipation: StudentParticipation[];
  totalSessions: number;
  attentionLeaderboard: {
    studentName: string;
    sessionsJoined: number;
    averageScore: number | null;
    isHardworkingLowScore: boolean;
  }[];
}): string {
  const parts: string[] = [];
  const totalStudents = summary.totalStudents;
  const attendancePct = Math.round(summary.attendanceRate);

  if (totalStudents > 0) {
    parts.push(
      pickRandom([
        `Tingkat partisipasi kelas tercatat ${attendancePct}% dari seluruh siswa.`,
        `Kehadiran siswa berada di angka ${attendancePct}%, dari total ${totalStudents} siswa.`,
        `Secara keseluruhan, tingkat kehadiran kelas mencapai ${attendancePct}%.`,
      ]),
    );
  }

  if (studentScores.length > 0) {
    const averageScore = Math.round(summary.averageScore);
    if (averageScore >= 80) {
      parts.push(
        `Nilai kuis rata-rata ${averageScore}%, menunjukkan pemahaman materi yang kuat dan berada di atas KKM 70.`,
      );
    } else if (averageScore >= 70) {
      parts.push(
        `Nilai kuis rata-rata ${averageScore}% dan sudah memenuhi KKM 70. Pertahankan cara belajar yang berjalan baik.`,
      );
    } else if (averageScore >= 60) {
      parts.push(
        `Nilai kuis rata-rata ${averageScore}%, masih di bawah KKM 70 sehingga beberapa materi mungkin perlu diulang.`,
      );
    } else {
      parts.push(
        `Nilai kuis rata-rata ${averageScore}%, jauh di bawah KKM 70 dan perlu penguatan materi dengan pendekatan berbeda.`,
      );
    }
  }

  const scoreProfiles = getStudentScoreProfiles(studentScores).sort(
    (first, second) => second.average - first.average,
  );
  const topPerformer = scoreProfiles[0];
  if (topPerformer) {
    parts.push(
      `Siswa dengan hasil tertinggi adalah ${topPerformer.studentName}, dengan rata-rata ${topPerformer.average}% dari ${topPerformer.sessionCount} sesi kuis.`,
    );
  }

  const participationByKey = new Map(
    studentParticipation.map((student) => [student.studentKey, student]),
  );
  const hardworkingStudents = attentionLeaderboard.filter(
    (student) => student.isHardworkingLowScore,
  );

  if (hardworkingStudents.length > 0) {
    if (hardworkingStudents.length === 1) {
      const student = hardworkingStudents[0];
      parts.push(
        `Di sisi lain, ${student.studentName} rajin masuk (${student.sessionsJoined} sesi) tetapi nilainya masih ${student.averageScore}%. Mungkin dia butuh cara belajar yang berbeda.`,
      );
    } else if (hardworkingStudents.length <= 3) {
      const names = hardworkingStudents.map((student) => student.studentName);
      parts.push(
        `Di sisi lain, ada ${hardworkingStudents.length} anak rajin masuk tetapi nilainya belum nyantol, yaitu ${names.join(", ")}. Mereka mungkin butuh pendekatan belajar yang berbeda.`,
      );
    } else {
      const topNames = hardworkingStudents
        .slice(0, 3)
        .map((student) => student.studentName);
      parts.push(
        `Di sisi lain, ada ${hardworkingStudents.length} anak rajin masuk tetapi nilainya belum nyantol. Di antaranya ${topNames.join(", ")}, dan ${hardworkingStudents.length - 3} lainnya. Mereka mungkin butuh pendekatan belajar yang berbeda.`,
      );
    }
  } else {
    const highScoringLowAttendance = scoreProfiles.find((student) => {
      const participation = participationByKey.get(student.studentKey);
      return participation !== undefined &&
        participation.sessionsJoined <= 5 &&
        student.average >= 75;
    });
    if (highScoringLowAttendance) {
      const participation = participationByKey.get(highScoringLowAttendance.studentKey);
      parts.push(
        `${highScoringLowAttendance.studentName} mendapat nilai bagus (${highScoringLowAttendance.average}%) meski hadir ${participation?.sessionsJoined} dari ${totalSessions} sesi.`,
      );
    }
  }

  if (attentionLeaderboard.length > 0) {
    parts.push(
      `${attentionLeaderboard.length} siswa perlu perhatian khusus. Lihat tab "Perlu Perhatian" untuk tindak lanjut.`,
    );
  }

  if (parts.length < 3) {
    parts.push(
      pickRandom([
        "Terus beri ruang bagi siswa untuk bertanya dan saling membantu.",
        "Aktivitas belajar yang konsisten dapat membantu menjaga pemahaman siswa.",
        "Dorong siswa untuk terus terlibat dalam sesi dan latihan berikutnya.",
      ]),
    );
  }

  return parts.join(" ");
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
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [studentParticipation, setStudentParticipation] = useState<
    StudentParticipation[]
  >([]);
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [scoreBySession, setScoreBySession] = useState<ScoreBySessionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
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
            getAnalyticsScoreBySession(),
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
          setScoreBySession(trendResult.value);
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
          failures.push("skor kuis per sesi");
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
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSessions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSessions]);

  const lowestScoringSession = scoreBySession.reduce<ScoreBySessionPoint | null>(
    (lowest, session) => lowest === null || session.avgScore < lowest.avgScore
      ? session
      : lowest,
    null,
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
    const attendanceThreshold = Math.max(7, totalSessions - 1);
    return [...studentsByKey.values()]
      .flatMap((student) => {
        const averageScore = student.scoreProfile?.average ?? null;
        const isCriticalScore = averageScore !== null && averageScore < 60;
        const isCriticalAttendance = student.sessionsJoined < 4;
        const isLowResponses = student.responsesSubmitted < 15;
        const isHardworkingLowScore =
          averageScore !== null &&
          averageScore >= 60 &&
          averageScore < 70 &&
          student.sessionsJoined >= attendanceThreshold;

        if (
          !isCriticalScore &&
          !isCriticalAttendance &&
          !isLowResponses &&
          !isHardworkingLowScore
        ) {
          return [];
        }

        const reasons: string[] = [];
        if (isCriticalScore) {
          reasons.push(`Nilai kritis (${averageScore}%)`);
        } else if (isHardworkingLowScore) {
          reasons.push(`Rajin hadir tapi nilai ${averageScore}%`);
        }

        if (isCriticalAttendance) {
          reasons.push(
            `Kehadiran rendah (${student.sessionsJoined} dari ${totalSessions} sesi)`,
          );
        }
        if (isLowResponses) {
          reasons.push(
            `Jarang menjawab (${student.responsesSubmitted} respons)`,
          );
        }

        let recommendation = "Dorong siswa untuk lebih aktif menjawab";
        if (isCriticalScore && isCriticalAttendance) {
          recommendation = "Prioritaskan — cek kendala belajar & kehadiran";
        } else if (isCriticalScore) {
          recommendation = "Beri pendampingan belajar tambahan";
        } else if (isCriticalAttendance) {
          recommendation = "Cek kendala kehadiran, follow up orang tua";
        } else if (isHardworkingLowScore) {
          recommendation = "Apresiasi usahanya, coba metode belajar berbeda";
        }

        const severity = isCriticalScore && isCriticalAttendance
          ? 1
          : isCriticalScore
            ? 2
            : isCriticalAttendance
              ? 2
              : isHardworkingLowScore
                ? 3
                : 4;

        return [{
          ...student,
          averageScore,
          isHardworkingLowScore,
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

  const classNarrative = useMemo(
    () =>
      summary
        ? generateNarrative({
          summary,
          studentScores,
          studentParticipation,
          totalSessions: summary.totalSessions,
          attentionLeaderboard,
        })
        : "",
    [summary, studentScores, studentParticipation, attentionLeaderboard],
  );

  const handleExportPDF = () => {
    if (!summary) {
      toast.add({
        title: "Data belum siap",
        description: "Tunggu data dimuat sebelum ekspor PDF.",
        type: "info",
      });
      return;
    }

    const leaderboardRows = leaderboardTab === "active"
      ? activeLeaderboard.slice(0, 10).map((row, index) => ({
        rank: index + 1,
        name: row.studentName,
        detail: `${row.sessionsJoined} sesi, ${row.questionsAsked} tanya, ${row.responsesSubmitted} jawaban`,
        value: `${row.sessionsJoined + row.questionsAsked + row.responsesSubmitted} aktivitas`,
      }))
      : leaderboardTab === "top-score"
        ? topScoreLeaderboard.slice(0, 10).map((row, index) => ({
          rank: index + 1,
          name: row.studentName,
          detail: `Dari ${row.sessionCount} sesi berkuis`,
          value: `${row.average}%`,
        }))
        : attentionLeaderboard.slice(0, 10).map((row, index) => ({
          rank: index + 1,
          name: row.studentName,
          detail: row.reason,
          value: row.averageScore === null ? "Belum ada skor" : `${row.averageScore}%`,
        }));

    try {
      exportAnalyticsPDF({
        summary: {
          totalStudents: summary.totalStudents,
          averageScore: summary.averageScore,
          attendanceRate: summary.attendanceRate,
          totalSessions: summary.totalSessions,
        },
        narrative: classNarrative,
        leaderboard: leaderboardRows,
        topTopics,
        teacherName: user?.name ?? "Guru",
      });
      toast.add({
        title: "Laporan PDF berhasil dibuat",
        description: "File PDF tersimpan di folder Downloads.",
        type: "success",
      });
    } catch {
      toast.add({
        title: "Ekspor PDF gagal",
        description: "Coba muat ulang data, lalu ekspor kembali.",
        type: "error",
      });
    }
  };

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

    if (!summary) {
      toast.add({
        title: "Data belum siap",
        description: "Tunggu ringkasan kelas dimuat sebelum ekspor CSV.",
        type: "info",
      });
      return;
    }

    const scoreRanked = [...scoreByStudent.entries()]
      .map(([studentKey, student]) => ({
        studentKey,
        average: student.average,
      }))
      .sort((first, second) => second.average - first.average);

    const scoreRankByKey = new Map(
      scoreRanked.map((student, index) => [student.studentKey, index + 1]),
    );

    const shortenStatus = (label: string) => {
      if (label.includes("Sangat Aktif")) return "Sangat Aktif";
      if (label.includes("Top Performer")) return "Top Performer";
      if (label.includes("Rajin")) return "Rajin";
      if (label.includes("Baik")) return "Baik";
      if (label.includes("Perlu Bimbingan")) return "Perlu Bimbingan";
      if (label.includes("Perlu Perhatian")) return "Perlu Perhatian";
      if (label.includes("Data terbatas")) return "Data Terbatas";
      return label;
    };

    const getFullStatus = (student: StudentParticipation) => {
      const score = scoreByStudent.get(student.studentKey);
      const totalSessions = summary.totalSessions;
      const attendanceRate = totalSessions > 0
        ? (student.sessionsJoined / totalSessions) * 100
        : 0;

      if (attendanceRate < 60) return "Jarang Hadir";
      if (!score) return "";

      const baseStatus = shortenStatus(
        getScoreStatus(score.average, score.sessionCount, student.sessionsJoined).label,
      );

      if (attendanceRate < 75 && baseStatus === "Baik") {
        return "Baik · Kehadiran";
      }

      return baseStatus;
    };

    const teacherName = user?.name ?? "Guru";
    const exportDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const lines: string[] = [];
    lines.push("# Laporan Analitik Qurio");
    lines.push(`# Guru: ${teacherName}`);
    lines.push(`# Tanggal Export: ${exportDate}`);
    lines.push(`# Periode: Semua data (${summary.totalSessions} sesi)`);
    lines.push("#");
    lines.push("# Kolom:");
    lines.push("# rank - ranking berdasarkan aktivitas (kehadiran + tanya + jawab)");
    lines.push("# score_rank - ranking berdasarkan rata-rata nilai kuis");
    lines.push("# attendance_pct - persentase kehadiran siswa");
    lines.push("# average_score_pct - rata-rata nilai kuis (0-100)");
    lines.push("# status - kategori otomatis");
    lines.push("");
    lines.push("# Catatan:");
    lines.push("# - rank & score_rank bisa berbeda. rank = aktivitas, score_rank = nilai.");
    lines.push("# - Sort di Excel by kolom mana yang mau jadi prioritas.");
    lines.push("");
    lines.push(
      "rank,score_rank,student_name,sessions_joined,total_sessions,attendance_pct,questions_asked,responses_submitted,average_score_pct,status",
    );

    const totalSessions = summary.totalSessions;
    const sortedParticipation = [...studentParticipation].sort(
      (first, second) =>
        second.sessionsJoined + second.questionsAsked + second.responsesSubmitted -
        (first.sessionsJoined + first.questionsAsked + first.responsesSubmitted),
    );

    sortedParticipation.forEach((p, index) => {
      const score = scoreByStudent.get(p.studentKey);
      const attendancePct = totalSessions > 0
        ? Math.round((p.sessionsJoined / totalSessions) * 100)
        : 0;
      const averageScorePct = score ? score.average : "";
      const scoreRank = scoreRankByKey.get(p.studentKey) ?? "";
      const status = getFullStatus(p);

      lines.push([
        index + 1,
        scoreRank,
        `"${p.studentName.replaceAll('"', '""')}"`,
        p.sessionsJoined,
        totalSessions,
        attendancePct,
        p.questionsAsked,
        p.responsesSubmitted,
        averageScorePct,
        `"${status.replaceAll('"', '""')}"`,
      ].join(","));
    });

    const csv = lines.join("\n");
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
        detail: "Siswa yang pernah ikut minimal 1 sesi",
      },
      {
        label: "Rata-rata Skor Kuis",
        value: summary ? `${Math.round(summary.averageScore)}%` : "-",
        detail:
          summary
            ? `Dari ${studentScores.length} jawaban kuis yang dinilai`
            : "Menunggu data jawaban kuis",
      },
      {
        label: "Tingkat Kehadiran",
        value: summary ? `${Math.round(summary.attendanceRate)}%` : "-",
        detail: summary
          ? `Rata-rata per sesi, dari ${summary.totalStudents} siswa terdaftar`
          : "Menunggu data kehadiran",
      },
      {
        label: "Sesi Dianalisis",
        value: summary ? String(summary.totalSessions) : "-",
        detail: summary
          ? `Total ${summary.totalSessions} sesi kelas Anda`
          : "Memuat...",
      },
    ];

  return (
    <div>
      {/* Header + tombol ekspor. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Performa Quiz
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Data dari sesi mode Quiz saja. Analytics interaktif ada di tab sebelah.
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
            disabled={isLoading || !summary}
            onClick={handleExportPDF}
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
            <span className="flex items-center gap-2"><IconBulb className="size-4 text-muted-foreground" />Ringkasan Kelas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading || !summary || (studentScores.length === 0 && studentParticipation.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              Insight akan muncul setelah ada data kuis dan partisipasi.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">
              {classNarrative}
            </p>
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

      {/* Skor rata-rata kuis per sesi. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            Skor Rata-rata per Sesi
          </CardTitle>
          <CardDescription>
            Persentase jawaban benar pada setiap sesi kuis dengan minimal 5 jawaban dinilai
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : scoreBySession.length > 0 ? (
            <ChartContainer
              config={scoreBySessionConfig}
              className="w-full aspect-auto"
              style={{ height: Math.max(240, scoreBySession.length * 44) }}
            >
              <BarChart
                data={scoreBySession}
                layout="vertical"
                margin={{ top: 8, right: 56, left: 8, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  type="category"
                  dataKey="sessionTitle"
                  tickFormatter={(value: string) =>
                    value.length > 22 ? `${value.slice(0, 20)}…` : value
                  }
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="sessionTitle"
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.sessionTitle ?? ""
                      }
                      formatter={(value, name) =>
                        name === "avgScore" ? `${value}%` : value
                      }
                    />
                  }
                />
                <Bar
                  dataKey="avgScore"
                  radius={[0, 4, 4, 0]}
                  animationDuration={600}
                >
                  {scoreBySession.map((session) => (
                    <Cell
                      key={session.sessionId}
                      fill={
                        session.avgScore >= 80
                          ? "#10b981"
                          : session.avgScore >= 70
                            ? "#3b82f6"
                            : session.avgScore >= 60
                              ? "#f59e0b"
                              : "#dc2626"
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="avgScore"
                    position="right"
                    formatter={(value) => `${Number(value)}%`}
                    className="fill-foreground text-xs font-semibold"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyBlock
              title="Belum ada sesi kuis yang cukup datanya"
              description="Sesi kuis akan tampil setelah memiliki minimal 5 jawaban yang dinilai."
              icon={<IconTrendingUp className="size-5" />}
            />
          )}
          {lowestScoringSession && !isLoading && (
            <p className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Skor terendah ada di sesi <span className="font-medium text-foreground">{lowestScoringSession.sessionTitle}</span> ({lowestScoringSession.avgScore}%). Pertimbangkan mengulang materi sesi ini.
            </p>
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
              className="h-80 min-w-[700px] w-full aspect-auto"
            >
              <BarChart
                data={topTopics.slice(0, 5)}
                layout="vertical"
                margin={{ top: 8, right: 56, left: 8, bottom: 0 }}
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
                  width={320}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: string) =>
                    value.length > 65 ? `${value.slice(0, 65)}…` : value
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      labelKey="questionText"
                      labelFormatter={(_label, payload) => {
                        const topic = payload?.[0]?.payload as
                          | TopTopic
                          | undefined;
                        return topic ? (
                          <div className="grid gap-1">
                            <span>{topic.questionText}</span>
                            <span className="font-normal text-muted-foreground">
                              Sesi: {topic.sessionTitle}
                            </span>
                          </div>
                        ) : null;
                      }}
                      formatter={(value, name, item) => {
                        if (name === "incorrectRate") {
                          return [
                            `${Math.round(Number(value))}% salah (${item.payload.totalAnswers} jawaban)`,
                            "Tingkat kesalahan",
                          ];
                        }
                        return [value, name];
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="incorrectRate"
                  radius={[0, 4, 4, 0]}
                  animationDuration={600}
                >
                  {topTopics.slice(0, 5).map((topic) => (
                    <Cell
                      key={topic.questionId}
                      fill={
                        topic.incorrectRate >= 70
                          ? "#dc2626"
                          : topic.incorrectRate >= 50
                            ? "#f59e0b"
                            : "#eab308"
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="incorrectRate"
                    position="right"
                    formatter={(value) => `${Math.round(Number(value))}%`}
                    className="fill-foreground text-xs font-semibold"
                  />
                </Bar>
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
                  : "Siswa yang perlu perhatian khusus: nilai rendah (<60), kehadiran jarang (<50% sesi), jarang menjawab (<15 respons), atau rajin hadir tapi nilainya belum optimal (60-69)."}
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
                  <IconAlertTriangle className="mr-1 inline size-3" />Perlu Perhatian
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
                    {activitySummary.studentCount} siswa terlibat · Rata-rata {activitySummary.average} aktivitas/siswa · Top 5 rata-rata {activitySummary.topFiveAverage} aktivitas
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
                      statusIcon: status.Icon,
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
                    {scoreSummary.studentCount} siswa dinilai · Rata-rata kelas {scoreSummary.average}% · Tertinggi {scoreSummary.highest}% · Terendah {scoreSummary.lowest}%
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
                    statusIcon: status.Icon,
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
            <div className="flex flex-col gap-6">
              {attentionLeaderboard.filter((student) => student.severity <= 2).length > 0 && (
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
                      <IconAlertOctagon className="size-4" />Butuh Tindakan Segera
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({attentionLeaderboard.filter((student) => student.severity <= 2).length} siswa)
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Siswa dengan nilai kritis atau kehadiran sangat rendah.
                  </p>
                  <LeaderboardTable
                    mode="attention"
                    rows={attentionLeaderboard
                      .filter((student) => student.severity <= 2)
                      .map((student, index) => ({
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
                </div>
              )}

              {attentionLeaderboard.filter((student) => student.isHardworkingLowScore).length > 0 && (
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                      <IconBarbell className="size-4" />Apresiasi Usaha, Bantu Pemahaman
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({attentionLeaderboard.filter((student) => student.isHardworkingLowScore).length} siswa)
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Siswa rajin hadir, tapi nilainya masih perlu ditingkatkan.
                  </p>
                  <LeaderboardTable
                    mode="attention"
                    rows={attentionLeaderboard
                      .filter((student) => student.isHardworkingLowScore)
                      .map((student, index) => ({
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
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-50 place-items-center rounded-xl border border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="max-w-sm">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  <span className="inline-flex items-center gap-2"><IconConfetti className="size-4" />Semua siswa dalam kondisi baik</span>
                </p>
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  Tidak ada siswa yang butuh perhatian khusus saat ini. Kelas Anda luar biasa!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
  statusIcon?: typeof IconStar;
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
    <div className="overflow-x-auto rounded-xl border border-border">
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
                    <Badge variant="outline" className={cn("gap-1", row.statusClassName)}>
                      {row.statusIcon && <row.statusIcon className="size-3" />}
                      {row.statusLabel}
                    </Badge>
                    {row.coverageLabel && (
                      <Badge
                        variant="outline"
                        className={cn("mt-1 ml-2", row.coverageClassName)}
                      >
                        {row.coverageLabel}
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
