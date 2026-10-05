"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconAward,
  IconBarbell,
  IconBulb,
  IconCircleCheck,
  IconCircleX,
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
import { selectQualifiedTopStudents } from "@/lib/analytics-selection";
import { cn } from "@/lib/utils";
import metricDefinitions from "@/lib/analytics-metrics.json";

const { thresholds: ANALYTICS_THRESHOLDS, metrics: ANALYTICS_METRICS } = metricDefinitions;

function formatMetricDefinition(text: string) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = ANALYTICS_THRESHOLDS[key as keyof typeof ANALYTICS_THRESHOLDS];
    return value === undefined ? _match : String(value);
  });
}

function MetricInfo({
  metric,
  actual,
}: {
  metric: keyof typeof ANALYTICS_METRICS;
  actual?: string;
}) {
  const definition = ANALYTICS_METRICS[metric];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  const dialogId = `metric-info-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const dialog = dialogRef.current;
      if (!trigger || !dialog) return;
      const anchor = trigger.getBoundingClientRect();
      const bounds = dialog.getBoundingClientRect();
      const padding = 16;
      const left = Math.max(padding, Math.min(anchor.left, window.innerWidth - bounds.width - padding));
      const below = anchor.bottom + 8;
      const top = below + bounds.height <= window.innerHeight - padding
        ? below
        : Math.max(padding, anchor.top - bounds.height - 8);
      setPosition({ left, top });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !dialogRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span className="inline-flex align-middle">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Cara menghitung ${definition.title}`}
        aria-expanded={open}
        aria-controls={dialogId}
        aria-describedby={open ? dialogId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconInfoCircle className="size-4" aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-label={`Cara menghitung ${definition.title}`}
          style={{ left: position.left, top: position.top }}
          className="fixed z-[100] grid max-h-[calc(100dvh-32px)] w-[min(360px,calc(100vw-32px))] gap-2 overflow-y-auto rounded-xl border border-border bg-popover p-4 text-left text-xs leading-relaxed text-popover-foreground shadow-xl"
        >
          <span className="font-semibold">Cara menghitung</span>
          <span>{formatMetricDefinition(definition.how)}</span>
          {actual && <><span className="font-semibold">Angka Anda</span><span>{actual}</span></>}
          <span className="font-semibold">Yang dihitung dan yang tidak</span>
          <span>{formatMetricDefinition(definition.filters)}</span>
          <span className="font-semibold">Ambang</span>
          <span>{formatMetricDefinition(definition.threshold)}</span>
        </div>, document.body,
      )}
    </span>
  );
}

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

function formatDateRange(startValue: string, endValue: string) {
  const dateFormat = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", timeZone: "Asia/Jakarta",
  });
  const yearFormat = new Intl.DateTimeFormat("id-ID", {
    year: "numeric", timeZone: "Asia/Jakarta",
  });
  const start = new Date(startValue);
  const end = new Date(endValue);
  const endYear = yearFormat.format(end);
  const startLabel = dateFormat.format(start);
  const endLabel = dateFormat.format(end);
  return yearFormat.format(start) === endYear
    ? `${startLabel} – ${endLabel} ${endYear}`
    : `${startLabel} ${yearFormat.format(start)} – ${endLabel} ${endYear}`;
}

const scoreBySessionConfig = {
  avgScore: { label: "Skor rata-rata", color: "var(--chart-2)" },
  totalAnswers: { label: "Jawaban dinilai" },
} satisfies ChartConfig;

const topicsConfig = {
  incorrectRate: { label: "Jawaban salah", color: "var(--chart-4)" },
} satisfies ChartConfig;

const mobileTopicColors = ["#dc2626", "#f59e0b", "#2563eb", "#16a34a", "#db2777"] as const;

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
 * Ambang warna berasal dari definisi metrik analytics.
 */
function getAttendanceColor(rate: number) {
  if (rate >= ANALYTICS_THRESHOLDS.highAttendanceColor) return "bg-emerald-500";
  if (rate >= ANALYTICS_THRESHOLDS.mediumAttendanceColor) return "bg-amber-500";
  return "bg-rose-500";
}

function getActivityStatus(responseCount: number) {
  if (responseCount >= ANALYTICS_THRESHOLDS.veryActiveResponses) {
    return {
      label: "Sangat Aktif",
      Icon: IconStar,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (responseCount >= ANALYTICS_THRESHOLDS.activeResponses) {
    return {
      label: "Aktif",
      Icon: IconCircleCheck,
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (responseCount >= ANALYTICS_THRESHOLDS.someActivityResponses) {
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
  if (score >= ANALYTICS_THRESHOLDS.excellentScore && sessionCount >= ANALYTICS_THRESHOLDS.minimumStudentSessions) {
    return {
      label: "Top Performer",
      Icon: IconTrophy,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    };
  }
  if (sessionsJoined >= 7 && score < ANALYTICS_THRESHOLDS.passingScore) {
    return {
      label: "Rajin, nilai perlu ditingkatkan",
      Icon: IconBarbell,
      className: "border-blue-500/20 bg-blue-500/15 text-blue-700 dark:text-blue-400",
    };
  }
  if (score >= ANALYTICS_THRESHOLDS.excellentScore) {
    return {
      label: "Data terbatas",
      Icon: IconInfoCircle,
      className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  if (score >= ANALYTICS_THRESHOLDS.passingScore) {
    return {
      label: "Baik",
      Icon: IconCircleCheck,
      className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
    };
  }
  if (score >= ANALYTICS_THRESHOLDS.lowScore) {
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

function generateNarrative({
  summary,
  totalSessions,
  hardestTopic,
  attentionLeaderboard,
}: {
  summary: AnalyticsSummary;
  totalSessions: number;
  hardestTopic: TopTopic | null;
  attentionLeaderboard: {
    studentName: string;
    sessionsJoined: number;
    averageScore: number | null;
  }[];
}): { goodNews: string[]; attention: string; action: string[] } {
  const goodNews: string[] = [];
  const actions: string[] = [];
  goodNews.push(summary.scoreGradedAnswers > 0
    ? summary.averageScore >= ANALYTICS_THRESHOLDS.passingScore
      ? `Skor kelas memenuhi KKM ${ANALYTICS_THRESHOLDS.passingScore}%`
      : `Skor kelas belum memenuhi KKM ${ANALYTICS_THRESHOLDS.passingScore}%`
    : "Belum ada skor kuis untuk dibandingkan dengan KKM");
  goodNews.push(totalSessions > 0
    ? summary.attendanceRate >= ANALYTICS_THRESHOLDS.lowAttendancePercent
      ? "Kehadiran kelas memenuhi ambang"
      : "Kehadiran kelas di bawah ambang"
    : "Belum ada data kehadiran");
  goodNews.push(`${totalSessions} sesi dianalisis`);

  if (hardestTopic && hardestTopic.incorrectRate > 0) {
    const question = hardestTopic.questionText.length > 72
      ? `${hardestTopic.questionText.slice(0, 69).trimEnd()}…`
      : hardestTopic.questionText;
    const rate = hardestTopic.incorrectRate.toLocaleString("id-ID", { maximumFractionDigits: 1 });
    actions.push(`Pertimbangkan mengulang materi: ${question} (${rate}% salah).`);
  }
  if (actions.length === 0) {
    actions.push("Lanjutkan pemantauan hasil kuis dan kehadiran pada sesi berikutnya.");
  }
  return {
    goodNews,
    attention: attentionLeaderboard.length > 0
      ? `${attentionLeaderboard.length} siswa memenuhi kriteria Perlu Perhatian.`
      : totalSessions >= ANALYTICS_THRESHOLDS.minimumStudentSessions
        ? "Tidak ada siswa yang memenuhi kriteria Perlu Perhatian pada periode ini."
        : `Data belum cukup (butuh minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi kelas untuk menilai kehadiran rendah).`,
    action: actions,
  };
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [studentParticipation, setStudentParticipation] = useState<
    StudentParticipation[]
  >([]);
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [scoreBySession, setScoreBySession] = useState<ScoreBySessionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [leaderboardTab, setLeaderboardTab] = useState<
    "active" | "top-score" | "attention"
  >("active");
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const [pendingAttentionJump, setPendingAttentionJump] = useState(false);
  const [highlightAttention, setHighlightAttention] = useState(false);
  const attentionHeadingRef = useRef<HTMLDivElement>(null);
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
            getAnalyticsTopics("all", ANALYTICS_THRESHOLDS.maximumTopicsDisplayed),
            getAnalyticsScoreBySession("all"),
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
        if (summaryResult.status === "fulfilled") setLastUpdatedAt(new Date());

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

  const hardestTopic = topTopics.reduce<TopTopic | null>(
    (hardest, topic) =>
      hardest === null || topic.incorrectRate > hardest.incorrectRate
        ? topic
        : hardest,
    null,
  );
  const mobileTopics = topTopics.slice(0, ANALYTICS_THRESHOLDS.maximumTopicsDisplayed);
  const mobileTopicAverage = mobileTopics.length
    ? mobileTopics.reduce((total, topic) => total + topic.incorrectRate, 0) /
      mobileTopics.length
    : 0;
  const topicSegmentDegrees = mobileTopics.length ? 360 / mobileTopics.length : 0;
  const topicDonutBackground = mobileTopics
    .map((_, index) => {
      const start = index * topicSegmentDegrees;
      const end = (index + 1) * topicSegmentDegrees;
      const gap = Math.min(3, topicSegmentDegrees / 8);
      return `${mobileTopicColors[index % mobileTopicColors.length]} ${start}deg ${end - gap}deg, var(--background) ${end - gap}deg ${end}deg`;
    })
    .join(", ");

  const scoreByStudent = useMemo(
    () => {
      const participationByKey = new Map(
        studentParticipation.map((student) => [student.studentKey, student]),
      );
      return new Map(
        getStudentScoreProfiles(studentScores).map((profile) => {
          const apiProfile = participationByKey.get(profile.studentKey);
          return [profile.studentKey, {
            ...profile,
            average: apiProfile?.averageScore ?? profile.average,
            sessionCount: apiProfile?.scoreSessions ?? profile.sessionCount,
          }];
        }),
      );
    },
    [studentScores, studentParticipation],
  );

  const topScoreLeaderboard = useMemo(
    () => {
      const ranked = selectQualifiedTopStudents([...scoreByStudent.entries()]
        .map(([studentKey, student]) => ({
          studentKey,
          studentName: student.studentName,
          average: student.average,
          sessionCount: student.sessionCount,
          standardDeviation: student.standardDeviation,
        })), ANALYTICS_THRESHOLDS.minimumStudentSessions);

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
      studentParticipation.map((student) => [student.studentKey, {
        ...student,
        scoreProfile: scoreByStudent.get(student.studentKey),
      }]),
    );
    for (const profile of scoreByStudent.values()) {
      if (!studentsByKey.has(profile.studentKey)) {
        studentsByKey.set(profile.studentKey, {
          studentKey: profile.studentKey,
          studentName: profile.studentName,
          sessionsJoined: profile.sessionCount,
          questionsAsked: 0,
          responsesSubmitted: 0,
          averageScore: profile.average,
          scoreSessions: profile.sessionCount,
          attendanceRate: null,
          needsAttention: profile.sessionCount >= ANALYTICS_THRESHOLDS.minimumStudentSessions && profile.average < ANALYTICS_THRESHOLDS.lowScore,
          scoreProfile: profile,
        });
      }
    }

    const totalSessions = summary?.totalSessions ?? 0;
    return [...studentsByKey.values()].flatMap((student) => {
      const dataSessions = student.scoreSessions ?? student.scoreProfile?.sessionCount ?? 0;
      const averageScore = student.averageScore ?? student.scoreProfile?.average ?? null;
      const attendanceRate = student.attendanceRate ?? (student.sessionsJoined / totalSessions) * 100;
      const isLowScore = dataSessions >= ANALYTICS_THRESHOLDS.minimumStudentSessions &&
        averageScore !== null && averageScore < ANALYTICS_THRESHOLDS.lowScore;
      const isLowAttendance = totalSessions >= ANALYTICS_THRESHOLDS.minimumStudentSessions &&
        attendanceRate < ANALYTICS_THRESHOLDS.lowAttendancePercent;
      const meetsAttentionRule = student.needsAttention ?? (isLowScore || isLowAttendance);
      if (!meetsAttentionRule) return [];
      const reasons = [
        ...(isLowScore ? [`Rata-rata skor ${averageScore}% (di bawah ${ANALYTICS_THRESHOLDS.lowScore}%)`] : []),
        ...(isLowAttendance ? [`Kehadiran ${Math.round(attendanceRate)}% (di bawah ${ANALYTICS_THRESHOLDS.lowAttendancePercent}%)`] : []),
      ];
      return [{
        ...student,
        averageScore,
        attendanceRate,
        isHardworkingLowScore: false,
        reason: reasons.join(" · "),
        recommendation: isLowScore ? "Tinjau pemahaman materi dan berikan dukungan belajar." : "Tinjau kendala kehadiran siswa.",
        severity: isLowScore && isLowAttendance ? 1 : 2,
      }];
    }).sort((first, second) => first.severity - second.severity ||
      (first.averageScore ?? 101) - (second.averageScore ?? 101));
  }, [studentParticipation, scoreByStudent, summary?.totalSessions]);

  const monitoredLeaderboard = useMemo(() => {
    const attentionKeys = new Set(attentionLeaderboard.map((student) => student.studentKey));
    return [...scoreByStudent.values()]
      .filter((student) =>
        student.sessionCount > 0 &&
        student.sessionCount <= ANALYTICS_THRESHOLDS.monitoringMaximumSessions &&
        student.sessionCount < ANALYTICS_THRESHOLDS.minimumStudentSessions &&
        student.average < ANALYTICS_THRESHOLDS.lowScore &&
        !attentionKeys.has(student.studentKey),
      )
      .map((student) => ({
        studentKey: student.studentKey,
        studentName: student.studentName,
        sessions: student.sessionCount,
        average: student.average,
      }))
      .sort((first, second) => first.average - second.average || first.sessions - second.sessions || first.studentName.localeCompare(second.studentName, "id"));
  }, [scoreByStudent, attentionLeaderboard]);

  const classNarrative = useMemo(
    () =>
      summary
        ? generateNarrative({
          summary,
          totalSessions: summary.totalSessions,
          hardestTopic,
          attentionLeaderboard,
        })
        : { goodNews: [], attention: "", action: [] },
    [summary, hardestTopic, attentionLeaderboard],
  );

  const jumpToAttentionList = () => {
    setLeaderboardTab("attention");
    setShowAllLeaderboard(true);
    setPendingAttentionJump(true);
  };

  useEffect(() => {
    if (!pendingAttentionJump || leaderboardTab !== "attention") return;
    const frame = window.requestAnimationFrame(() => {
      const target = attentionHeadingRef.current;
      if (!target) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.focus({ preventScroll: true });
      const destination = target.closest<HTMLElement>("#students-needing-attention");
      if (destination) {
        const scrollMargin = Number.parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
        const top = destination.getBoundingClientRect().top + window.scrollY - scrollMargin;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
      }
      setHighlightAttention(true);
      window.setTimeout(() => setHighlightAttention(false), 1800);
      setPendingAttentionJump(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingAttentionJump, leaderboardTab]);

  const handleExportPDF = () => {
    if (!summary) {
      toast.add({
        title: "Data belum siap",
        description: "Tunggu data dimuat sebelum ekspor PDF.",
        type: "info",
      });
      return;
    }

    try {
      exportAnalyticsPDF({
        summary,
        classNarrative,
        leaderboard: topScoreLeaderboard.map((row, index) => ({
          rank: index + 1,
          name: row.studentName,
          sessionCount: row.sessionCount,
          value: `${row.average}%`,
        })),
        attentionStudents: attentionLeaderboard.map((student) => ({
          name: student.studentName,
          sessionsJoined: student.sessionsJoined,
          averageScore: student.averageScore,
          reason: student.reason,
          recommendation: student.recommendation,
        })),
        monitoredStudents: monitoredLeaderboard.map((student) => ({
          name: student.studentName,
          sessions: student.sessions,
          averageScore: student.average,
        })),
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

    const scoreRanked = selectQualifiedTopStudents([...scoreByStudent.entries()]
      .map(([studentKey, student]) => ({
        studentKey,
        studentName: student.studentName,
        average: student.average,
        sessionCount: student.sessionCount,
      })), ANALYTICS_THRESHOLDS.minimumStudentSessions);

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
      if (attentionLeaderboard.some((row) => row.studentKey === student.studentKey)) {
        return "Perlu Perhatian";
      }
      if (monitoredLeaderboard.some((row) => row.studentKey === student.studentKey)) {
        return "Perlu Dipantau (data terbatas)";
      }
      if (!score || score.sessionCount < ANALYTICS_THRESHOLDS.minimumStudentSessions) {
        return "Data terbatas";
      }
      return shortenStatus(getScoreStatus(score.average, score.sessionCount, student.sessionsJoined).label);
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
    lines.push(`# - Perlu Perhatian: skor <${ANALYTICS_THRESHOLDS.lowScore}% dengan minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi siswa; atau kehadiran <${ANALYTICS_THRESHOLDS.lowAttendancePercent}% jika total sesi kelas >=${ANALYTICS_THRESHOLDS.minimumStudentSessions}.`);
    lines.push(`# - Perlu Dipantau (data terbatas): skor <${ANALYTICS_THRESHOLDS.lowScore}% dengan 1 sampai ${ANALYTICS_THRESHOLDS.monitoringMaximumSessions} sesi data, selama siswa tidak memenuhi kriteria Perlu Perhatian.`);
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
    metric: keyof typeof ANALYTICS_METRICS;
    actual?: string;
  }[] = [
      {
        label: "Total Siswa",
        value: summary ? String(summary.totalStudents) : "-",
        detail: "Siswa unik yang menjawab kuis yang dinilai",
        metric: "students",
        actual: summary ? `${summary.totalStudents} nama siswa unik memiliki jawaban Quiz yang dinilai.` : undefined,
      },
      {
        label: "Rata-rata Skor Kuis",
        value: summary ? `${Math.round(summary.averageScore)}%` : "-",
        detail:
          summary
            ? `${summary.scoreCorrectAnswers} benar ÷ ${summary.scoreGradedAnswers} dinilai`
            : "Menunggu data jawaban kuis",
        metric: "averageScore",
        actual: summary
          ? `${Math.round(summary.averageScore)}% ≈ ${summary.scoreCorrectAnswers} jawaban benar ÷ ${summary.scoreGradedAnswers} jawaban dinilai (kartu dibulatkan ke persen bulat).`
          : undefined,
      },
      {
        label: "Tingkat Kehadiran",
        value: summary ? `${Math.round(summary.attendanceRate)}%` : "-",
        detail: summary
          ? `Rata-rata persentase dari ${summary.totalSessions} sesi`
          : "Menunggu data kehadiran",
        metric: "attendance",
        actual: summary
          ? `${Math.round(summary.attendanceRate)}% ≈ rata-rata ${summary.attendanceBreakdown.map((item) => `${item.joined}/${item.classSize} (${item.rate}%)${item.overCapacity ? " [melebihi kapasitas; dibatasi 100%]" : ""}`).join(" + ")} dari ${summary.attendanceBreakdown.length} sesi (kartu dibulatkan ke persen bulat).`
          : undefined,
      },
      {
        label: "Sesi Dianalisis",
        value: summary ? String(summary.totalSessions) : "-",
        detail: summary
          ? "Sesi Quiz dengan jawaban dinilai"
          : "Memuat...",
        metric: "sessions",
        actual: summary ? `${summary.totalSessions} sesi memenuhi filter cakupan.` : undefined,
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
            Hanya sesi Quiz dengan minimal satu jawaban yang dinilai.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sumber data: {summary?.totalSessions ?? 0} sesi · {summary?.rangeStart
            ? formatDateRange(summary.rangeStart, summary.rangeEnd ?? summary.rangeStart)
              : "belum ada rentang data"} · {lastUpdatedAt ? `Diperbarui hari ini ${timeFormatter.format(lastUpdatedAt)}` : "Belum diperbarui"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        {overviewItems.map(({ label, value, detail, compact, metric, actual }) => (
          <Card
            key={label}
            className="rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none"
          >
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
                {label} <MetricInfo metric={metric} actual={actual} />
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{detail}</p>
                {(metric === "averageScore" || metric === "attendance") && summary && (
                  <Badge className={cn(
                    "text-xs",
                    metric === "averageScore"
                      ? summary.averageScore >= ANALYTICS_THRESHOLDS.passingScore
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      : summary.attendanceRate >= ANALYTICS_THRESHOLDS.lowAttendancePercent
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
                  )}>
                    {metric === "averageScore"
                      ? summary.averageScore >= ANALYTICS_THRESHOLDS.passingScore ? `Di atas KKM ${ANALYTICS_THRESHOLDS.passingScore}` : `Di bawah KKM ${ANALYTICS_THRESHOLDS.passingScore}`
                      : summary.attendanceRate >= ANALYTICS_THRESHOLDS.lowAttendancePercent ? "Sesuai ambang kehadiran" : "Di bawah ambang kehadiran"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ringkasan insight kelas berbasis aturan. */}
      <Card className="mt-6 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] dark:shadow-none">
        <CardHeader className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-base font-semibold text-foreground">
            <span className="flex items-center gap-2"><IconBulb className="size-4 text-muted-foreground" />Ringkasan Kelas <MetricInfo metric="classSummary" actual={`${classNarrative.goodNews.join(". ")}. ${classNarrative.attention} ${classNarrative.action.join(" ")}`} /></span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
      {isLoading || !summary || (studentScores.length === 0 && studentParticipation.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              Insight akan muncul setelah ada data kuis dan partisipasi.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                ["Kabar baik", "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"],
                ["Perlu perhatian", "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30"],
                ["Saran tindakan", "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30"],
              ] as const).map(([title, style]) => (
                <section key={title} className={cn("rounded-xl border p-3", style)}>
                  <h3 className="text-xs font-semibold text-foreground">{title}</h3>
                  {title === "Kabar baik" ? (
                    <ul className="mt-1 grid gap-1 text-xs leading-relaxed text-foreground">
                      {classNarrative.goodNews.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : title === "Perlu perhatian" ? (
                    <div className="mt-1">
                      <p className="text-xs leading-relaxed text-foreground">{classNarrative.attention}</p>
                      {attentionLeaderboard.length > 0 && (
                        <>
                          <div className="mt-2 flex flex-wrap gap-2" aria-label="Siswa yang perlu perhatian">
                            {attentionLeaderboard.slice(0, 3).map((student) => (
                              <span key={student.studentKey} className="inline-flex min-h-11 max-w-full items-center rounded-full border border-amber-300 bg-white px-3 text-xs font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                                <span className="max-w-full truncate">{student.studentName}</span>
                              </span>
                            ))}
                            {attentionLeaderboard.length > 3 && (
                              <span className="inline-flex min-h-11 items-center rounded-full border border-amber-300 bg-white px-3 text-xs font-medium text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                                +{attentionLeaderboard.length - 3} lainnya
                              </span>
                            )}
                          </div>
                          <button type="button" onClick={jumpToAttentionList} className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-left text-xs font-semibold text-blue-800 underline decoration-2 underline-offset-4 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 dark:text-blue-300 dark:hover:text-blue-100 dark:focus-visible:ring-blue-300">
                            Lihat daftar Siswa Perlu Perhatian
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 grid gap-2 text-xs leading-relaxed text-foreground">
                      {classNarrative.action.map((item) => <p key={item}>{item}</p>)}
                      {attentionLeaderboard.length > 0 && <p className="font-medium">Mulai dari daftar Siswa Perlu Perhatian di atas.</p>}
                    </div>
                  )}
                </section>
              ))}
            </div>
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
                <span className="inline-flex items-center gap-1.5">Kehadiran per Sesi <MetricInfo metric="attendanceBySession" actual={summary.attendanceBreakdown.map((item) => `${item.joined}/${item.classSize}`).join(", ")} /></span>
              </CardTitle>
              <CardDescription>
                Sesi dengan kehadiran terendah ditampilkan lebih dulu
              </CardDescription>
            </CardHeader>
            {summary.attendanceBreakdown.some((item) => item.overCapacity) && (
              <p role="status" className="mx-5 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:mx-6 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <IconAlertTriangle className="mr-1 inline size-3.5" aria-hidden="true" />
                Jumlah responden unik melebihi kapasitas pada {summary.attendanceBreakdown.filter((item) => item.overCapacity).length} sesi. Persentase dibatasi maksimal 100%; periksa kembali class_size.
              </p>
            )}
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
                        style={{ width: `${Math.min(100, item.rate)}%` }}
                        />
                      </span>
                      <span className="w-16 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {item.joined}/{item.classSize}
                      </span>
                      <span className="w-12 text-right text-sm font-bold tabular-nums text-foreground">
                        {Math.round(item.rate)}%
                      </span>
                      {item.overCapacity && (
                        <span className="shrink-0 text-amber-700 dark:text-amber-300" title="Responden unik melebihi class_size">
                          <IconAlertTriangle className="size-4" aria-label="Responden melebihi kapasitas" />
                        </span>
                      )}
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
            <span className="inline-flex items-center gap-1.5">Skor Rata-rata per Sesi <MetricInfo metric="scoreBySession" actual={scoreBySession.slice(0, 3).map((item) => `${item.sessionTitle}: ${item.correctAnswers}/${item.totalAnswers}`).join(" · ")} /></span>
          </CardTitle>
          <CardDescription>
            Persentase jawaban benar per sesi (minimal {ANALYTICS_THRESHOLDS.minimumAnswersForChart} jawaban dinilai)
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
                          : session.avgScore >= ANALYTICS_THRESHOLDS.passingScore
                            ? "#3b82f6"
                            : session.avgScore >= ANALYTICS_THRESHOLDS.lowScore
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
              description={`Sesi kuis akan tampil setelah memiliki minimal ${ANALYTICS_THRESHOLDS.minimumAnswersForChart} jawaban yang dinilai.`}
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
            <span className="inline-flex items-center gap-1.5">Topik Paling Sulit <MetricInfo metric="hardestTopics" actual={topTopics.slice(0, ANALYTICS_THRESHOLDS.maximumTopicsDisplayed).map((topic) => `${topic.incorrectAnswers}/${topic.totalAnswers} jawaban salah`).join("; ")} /></span>
          </CardTitle>
          <CardDescription>
            Persentase jawaban salah per soal kuis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-4 sm:p-6 sm:pt-4">
          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : topTopics.length > 0 ? (
            <>
              <div className="grid gap-5 xl:hidden">
                <div
                  role="img"
                  aria-label={`Rata-rata jawaban salah lima topik teratas ${mobileTopicAverage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`}
                  className="mx-auto grid size-44 place-items-center rounded-full"
                  style={{ background: `conic-gradient(${topicDonutBackground})` }}
                >
                  <div className="grid size-36 place-content-center rounded-full bg-card text-center">
                    <span className="text-xl font-bold tabular-nums text-foreground">
                      {mobileTopicAverage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">Rata-rata salah</span>
                  </div>
                </div>

                <ul className="m-0 grid list-none gap-2.5 p-0">
                  {mobileTopics.map((topic, index) => (
                    <li
                      key={topic.questionId}
                      className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1 size-2.5 rounded-full"
                        style={{ backgroundColor: mobileTopicColors[index % mobileTopicColors.length] }}
                      />
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-medium leading-snug text-foreground">{topic.questionText}</span>
                        <span className="mt-1 block break-words text-xs text-muted-foreground">{topic.sessionTitle}</span>
                      </span>
                      <span className="text-sm font-bold tabular-nums text-foreground">{topic.incorrectRate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ChartContainer
                config={topicsConfig}
                className="hidden h-80 min-w-[700px] w-full aspect-auto xl:flex"
              >
                <BarChart
                  data={topTopics.slice(0, ANALYTICS_THRESHOLDS.maximumTopicsDisplayed)}
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
                    {topTopics.slice(0, ANALYTICS_THRESHOLDS.maximumTopicsDisplayed).map((topic) => (
                      <Cell
                        key={topic.questionId}
                        fill={
                          topic.incorrectRate >= ANALYTICS_THRESHOLDS.highErrorColor
                            ? "#dc2626"
                            : topic.incorrectRate >= ANALYTICS_THRESHOLDS.mediumErrorColor
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
            </>
          ) : (
            <EmptyBlock
              title="Belum ada topik tersulit"
              description="Topik muncul setelah minimal lima jawaban tercatat untuk satu soal kuis."
            />
          )}
          {hardestTopic && !isLoading && (
            <p className="mt-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Persentase jawaban salah tertinggi ada pada soal <span className="font-medium text-foreground">{hardestTopic.questionText}</span> di sesi <span className="font-medium text-foreground">{hardestTopic.sessionTitle}</span> ({hardestTopic.incorrectRate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%). Pertimbangkan mengulang materi terkait.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard global siswa. */}
      <Card id="students-needing-attention" className={cn("mt-6 scroll-mt-24 rounded-[20px] border-border py-0 shadow-[0_8px_24px_rgb(15_23_42/0.05)] transition-shadow duration-300 dark:shadow-none sm:scroll-mt-28", highlightAttention && "ring-2 ring-primary ring-offset-2")}>
        <CardHeader className="grid-cols-1 p-5 pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6 sm:pb-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle ref={attentionHeadingRef} tabIndex={-1} className="text-base font-semibold text-foreground focus:outline-none">
                {leaderboardTab === "active"
                  ? "Siswa Paling Aktif"
                  : leaderboardTab === "top-score"
                    ? "Siswa dengan Nilai Terbaik"
                    : "Siswa yang Perlu Perhatian"}
              </CardTitle>
              <MetricInfo
                metric={leaderboardTab === "active" ? "activeStudents" : leaderboardTab === "top-score" ? "topStudents" : "studentsNeedingAttention"}
                actual={leaderboardTab === "attention"
                  ? `${attentionLeaderboard.length} siswa memenuhi kriteria.`
                  : leaderboardTab === "active"
                    ? `${activitySummary.studentCount} siswa; rata-rata ${activitySummary.average} aktivitas per siswa.`
                    : scoreSummary
                      ? `${scoreSummary.studentCount} profil skor; rerata profil ${scoreSummary.average}%, nilai tertinggi ${scoreSummary.highest}%.`
                      : "Belum ada profil skor."}
              />
            </div>
            <CardDescription className="mt-1 max-w-2xl">
              {leaderboardTab === "active"
                ? "Diurutkan berdasarkan jumlah aktivitas: bergabung sesi, bertanya, dan menjawab. Cocok untuk melihat siapa yang paling terlibat di kelas."
                : leaderboardTab === "top-score"
                  ? "Diurutkan berdasarkan rata-rata nilai kuis. Cocok untuk melihat siapa yang paling paham materi."
                  : `Perhatian: skor <${ANALYTICS_THRESHOLDS.lowScore}% dengan minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi, atau hadir <${ANALYTICS_THRESHOLDS.lowAttendancePercent}% dari total sesi jika kelas memiliki minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi.`}
            </CardDescription>
          </div>
          <div className="col-start-1 row-start-2 w-full justify-self-stretch sm:col-start-2 sm:row-start-1 sm:w-auto sm:justify-self-end">
            <Tabs
              value={leaderboardTab}
              onValueChange={(value) => {
                setLeaderboardTab(value as "active" | "top-score" | "attention");
                setShowAllLeaderboard(false);
              }
              }
              className="w-full gap-0 sm:w-auto"
            >
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-full border-b-0 bg-muted px-1 py-1 sm:flex sm:h-8 sm:w-fit">
                <TabsTrigger
                  value="active"
                  className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal break-words rounded-full border-b-0 px-1.5 text-center text-xs leading-tight data-active:border-transparent data-active:bg-background data-active:text-foreground sm:h-6 sm:min-h-0 sm:flex-none sm:whitespace-nowrap sm:px-3 sm:text-xs"
                >
                  Paling Aktif
                </TabsTrigger>
                <TabsTrigger
                  value="top-score"
                  className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal break-words rounded-full border-b-0 px-1.5 text-center text-xs leading-tight data-active:border-transparent data-active:bg-background data-active:text-foreground sm:h-6 sm:min-h-0 sm:flex-none sm:whitespace-nowrap sm:px-3 sm:text-xs"
                >
                  Skor Tertinggi
                </TabsTrigger>
                <TabsTrigger
                  value="attention"
                  className="h-auto min-h-9 min-w-0 flex-1 whitespace-normal break-words rounded-full border-b-0 px-1.5 text-center text-xs leading-tight data-active:border-transparent data-active:bg-background data-active:text-foreground sm:h-6 sm:min-h-0 sm:flex-none sm:whitespace-nowrap sm:px-3 sm:text-xs"
                >
                  <IconAlertTriangle className="mr-1 hidden size-3 sm:inline" />Perlu Perhatian
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
              title={scoreByStudent.size > 0 ? "Belum ada siswa dengan data yang cukup" : "Belum ada nilai kuis"}
              description={scoreByStudent.size > 0
                ? `Papan Skor Tertinggi hanya memuat siswa dengan minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi data. Siswa dengan skor rendah dan 1–${ANALYTICS_THRESHOLDS.monitoringMaximumSessions} sesi muncul di bagian Perlu Dipantau.`
                : "Peringkat ini akan muncul setelah siswa menjawab kuis pada sesi yang dianalisis."}
              icon={<IconAward className="size-5" />}
            />
          ) : (
            <div className="flex flex-col gap-8">
              <section aria-labelledby="attention-list-title" className="grid gap-3">
                <div>
                  <h3 id="attention-list-title" className="text-sm font-semibold text-foreground">Perlu Perhatian ({attentionLeaderboard.length})</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Skor rata-rata &lt;{ANALYTICS_THRESHOLDS.lowScore}% (minimal {ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi) atau hadir &lt;{ANALYTICS_THRESHOLDS.lowAttendancePercent}% dari total sesi (total sesi kelas minimal {ANALYTICS_THRESHOLDS.minimumStudentSessions}).</p>
                </div>
                {attentionLeaderboard.length > 0 ? (
                  <LeaderboardTable
                    mode="attention"
                    rows={attentionLeaderboard.map((student, index) => ({
                      rank: index + 1,
                      name: student.studentName,
                      detail: `${student.sessionsJoined} dari ${summary?.totalSessions ?? 0} sesi · skor ${student.averageScore ?? "—"}%`,
                      value: "",
                      statusLabel: "",
                      statusClassName: "",
                      reason: student.reason,
                      recommendation: student.recommendation,
                    }))}
                  />
                ) : (
                  <p className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                    {summary && summary.totalSessions < ANALYTICS_THRESHOLDS.minimumStudentSessions
                      ? `Belum cukup sesi kelas untuk menilai kriteria kehadiran (minimal ${ANALYTICS_THRESHOLDS.minimumStudentSessions} sesi).`
                      : "Tidak ada siswa yang memenuhi kriteria Perlu Perhatian."}
                  </p>
                )}
              </section>

              <section aria-labelledby="monitoring-list-title" className="grid gap-3">
                <div>
                  <h3 id="monitoring-list-title" className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    Perlu Dipantau (data terbatas) ({monitoredLeaderboard.length})
                    <MetricInfo metric="studentsToMonitor" actual={`${monitoredLeaderboard.length} siswa; skor di bawah ${ANALYTICS_THRESHOLDS.lowScore}% dari 1 sampai ${ANALYTICS_THRESHOLDS.monitoringMaximumSessions} sesi, tanpa kriteria Perlu Perhatian.`} />
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Skor rata-rata &lt;{ANALYTICS_THRESHOLDS.lowScore}% dengan 1–{ANALYTICS_THRESHOLDS.monitoringMaximumSessions} sesi data. Siswa yang memenuhi Perlu Perhatian hanya muncul pada daftar di atas.</p>
                </div>
                {monitoredLeaderboard.length > 0 ? (
                  <LeaderboardTable
                    mode="monitoring"
                    rows={monitoredLeaderboard.map((student, index) => ({
                      rank: index + 1,
                      name: student.studentName,
                      detail: `Skor rendah, data baru ${student.sessions} sesi`,
                      value: "",
                      statusLabel: "",
                      statusClassName: "",
                      reason: `Rata-rata skor ${student.average}% (di bawah ${ANALYTICS_THRESHOLDS.lowScore}%).`,
                      recommendation: "Kumpulkan hasil dari sesi berikutnya sebelum evaluasi lanjutan.",
                    }))}
                  />
                ) : (
                  <p className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">Tidak ada siswa dengan skor rendah dan data terbatas yang belum memenuhi kriteria Perlu Perhatian.</p>
                )}
              </section>
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

function LeaderboardTable({
  rows,
  mode,
}: {
  rows: LeaderboardRow[];
  mode: "active" | "top-score" | "attention" | "monitoring";
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader className="bg-muted text-muted-foreground">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-3 py-2 text-center font-semibold">
              #
            </TableHead>
            {mode === "attention" || mode === "monitoring" ? (
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
              <span aria-label={mode === "attention" ? "Perlu perhatian" : mode === "monitoring" ? "Data terbatas" : `Peringkat ${row.rank}`}>
                {mode === "attention" ? (
                  <IconAlertTriangle className={cn("mx-auto size-4", row.reason?.includes("Rata-rata skor") ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")} aria-hidden="true" />
                ) : mode === "monitoring" ? (
                  <span className="mx-auto block size-3 rounded-full bg-amber-500" aria-hidden="true" />
                ) : mode === "top-score" && row.rank <= 3 ? row.rank === 1
                    ? "🥇"
                    : row.rank === 2
                      ? "🥈"
                      : row.rank === 3
                        ? "🥉"
                        : row.rank : row.rank}
              </span>
              </TableCell>
              {mode === "attention" || mode === "monitoring" ? (
                <>
                  <TableCell className="min-w-40 px-3 py-3">
                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.detail}</p>
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
                    <p className="whitespace-normal text-xs leading-relaxed text-muted-foreground">
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
