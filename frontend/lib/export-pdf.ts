import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalyticsSummary, TopTopic } from "./api";
import metricDefinitions from "./analytics-metrics.json";

interface LeaderboardRowPDF {
  rank: number;
  name: string;
  sessionCount: number;
  value: string;
}

interface AttentionStudentPDF {
  name: string;
  sessionsJoined: number;
  averageScore: number | null;
  reason: string;
  recommendation: string;
}

interface MonitoredStudentPDF {
  name: string;
  sessions: number;
  averageScore: number;
}

interface ClassNarrativePDF {
  goodNews: string[];
  attention: string;
  action: string[];
}

export interface AnalyticsPDFInput {
  summary: AnalyticsSummary;
  classNarrative: ClassNarrativePDF;
  leaderboard: LeaderboardRowPDF[];
  attentionStudents: AttentionStudentPDF[];
  monitoredStudents: MonitoredStudentPDF[];
  topTopics: TopTopic[];
  teacherName: string;
}

const { metrics, thresholds, scope } = metricDefinitions;

function formatMetricDefinition(text: string) {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = thresholds[key as keyof typeof thresholds];
    return value === undefined ? _match : String(value);
  });
}

function safeText(value: string) {
  return value
    .replace(/θ/g, "theta")
    .replace(/α/g, "alpha")
    .replace(/β/g, "beta")
    .replace(/π/g, "pi")
    .replace(/√/g, "akar")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ensureSectionSpace(doc: jsPDF, y: number, minimum = 34) {
  const bottom = doc.internal.pageSize.height - 20;
  if (y + minimum > bottom) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  const startY = ensureSectionSpace(doc, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text(safeText(title), 14, startY);
  const page = (doc.internal as typeof doc.internal & { getCurrentPageInfo: () => { pageNumber: number } }).getCurrentPageInfo().pageNumber;
  return { startY: startY + 5, page };
}

function metricNote(metric: keyof typeof metrics) {
  const definition = metrics[metric];
  return `${definition.title}: ${formatMetricDefinition(definition.how)} Ambang: ${formatMetricDefinition(definition.threshold)}`;
}

export function createAnalyticsPDF({
  summary,
  classNarrative,
  leaderboard,
  attentionStudents,
  monitoredStudents,
  topTopics,
  teacherName,
}: AnalyticsPDFInput) {
  const doc = new jsPDF();
  const now = new Date();
  const reportDate = now.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
  const reportTime = now.toLocaleString("id-ID", {
    dateStyle: "long", timeStyle: "short",
  });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Analitik Kelas", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Guru: ${safeText(teacherName)}`, 14, 28);
  doc.text(`Tanggal: ${reportDate}`, 14, 34);
  doc.setTextColor(0);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Kelas", 14, 48);
  autoTable(doc, {
    startY: 52,
    head: [["Metrik", "Nilai", "Status"]],
    body: [
      ["Total Siswa", String(summary.totalStudents), "Siswa unik"],
      [
        "Rata-rata Skor Kuis",
        `${Math.round(summary.averageScore)}% (${summary.scoreCorrectAnswers}/${summary.scoreGradedAnswers})`,
        summary.averageScore >= thresholds.passingScore
          ? `Memenuhi KKM ${thresholds.passingScore}`
          : `Di bawah KKM ${thresholds.passingScore}`,
      ],
      [
        "Tingkat Kehadiran",
        `${Math.round(summary.attendanceRate)}%`,
        summary.attendanceRate >= thresholds.lowAttendancePercent
          ? "Memenuhi ambang kehadiran"
          : "Di bawah ambang kehadiran",
      ],
      ["Sesi Dianalisis", String(summary.totalSessions), "Sesi Quiz dinilai"],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 90, 246] },
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 50 }, 2: { cellWidth: 60 } },
    margin: { bottom: 22 },
  });
  let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  currentY = ensureSectionSpace(doc, currentY, 40);
  const leaderboardTitle = addSectionTitle(doc, "Papan Peringkat Siswa (Skor Tertinggi)", currentY);
  autoTable(doc, {
    startY: leaderboardTitle.startY,
    head: [["#", "Nama Siswa", "Detail", "Skor"]],
    body: leaderboard.length > 0
      ? leaderboard.slice(0, 10).map((row) => [
        String(row.rank), safeText(row.name), `Dari ${row.sessionCount} sesi data`, safeText(row.value),
      ])
      : [["—", "Belum ada siswa dengan minimal 3 sesi data", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [16, 140, 100] },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak", valign: "middle" },
    columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 50 }, 2: { cellWidth: 75 }, 3: { cellWidth: 25, halign: "right" } },
    margin: { bottom: 22 },
  });
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  const topicsTitle = addSectionTitle(doc, "Topik Paling Sulit", currentY);
  autoTable(doc, {
    startY: topicsTitle.startY,
    head: [["Teks Soal", "Sesi", "% Salah", "Jawaban", "Kesulitan"]],
    body: topTopics.length > 0
      ? topTopics.map((topic) => [
        safeText(topic.questionText),
        safeText(topic.sessionTitle),
        `${topic.incorrectRate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
        String(topic.totalAnswers),
        topic.incorrectRate >= thresholds.highErrorColor
          ? "Tinggi"
          : topic.incorrectRate >= thresholds.mediumErrorColor ? "Sedang" : "Rendah",
      ])
      : [["Belum ada soal yang memenuhi jumlah jawaban minimum.", "", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [190, 55, 55] },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak", valign: "top" },
    columnStyles: { 0: { cellWidth: 68 }, 1: { cellWidth: 32 }, 2: { cellWidth: 20, halign: "center" }, 3: { cellWidth: 18, halign: "center" }, 4: { cellWidth: 25, halign: "center" } },
    margin: { bottom: 22 },
    rowPageBreak: "avoid",
  });
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  const attentionTitle = addSectionTitle(doc, "Siswa yang Perlu Perhatian", currentY);
  const attentionPage = attentionTitle.page;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    safeText(`Skor <${thresholds.lowScore}% dengan minimal ${thresholds.minimumStudentSessions} sesi data; atau hadir <${thresholds.lowAttendancePercent}% jika kelas memiliki minimal ${thresholds.minimumStudentSessions} sesi.`),
    14,
    attentionTitle.startY,
  );
  autoTable(doc, {
    startY: attentionTitle.startY + 4,
    head: [["#", "Nama Siswa", "Alasan", "Tindakan"]],
    body: attentionStudents.length > 0
      ? attentionStudents.map((student, index) => [
        String(index + 1), safeText(student.name), safeText(student.reason), safeText(student.recommendation),
      ])
      : [["—", "Tidak ada siswa yang memenuhi kriteria.", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [190, 55, 55] },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak", valign: "top" },
    columnStyles: { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: 40 }, 2: { cellWidth: 55 }, 3: { cellWidth: 55 } },
    margin: { bottom: 22 },
    rowPageBreak: "avoid",
  });
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  const monitoringTitle = addSectionTitle(doc, "Perlu Dipantau (data terbatas)", currentY);
  autoTable(doc, {
    startY: monitoringTitle.startY,
    head: [["#", "Nama Siswa", "Status", "Skor"]],
    body: monitoredStudents.length > 0
      ? monitoredStudents.map((student, index) => [
        String(index + 1),
        safeText(student.name),
        `Skor rendah, data baru ${student.sessions} sesi`,
        `${student.averageScore}%`,
      ])
      : [["—", "Tidak ada siswa dengan data terbatas yang memenuhi kondisi ini.", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [165, 105, 20] },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak", valign: "top" },
    columnStyles: { 0: { cellWidth: 9, halign: "center" }, 1: { cellWidth: 50 }, 2: { cellWidth: 80 }, 3: { cellWidth: 25, halign: "center" } },
    margin: { bottom: 22 },
    rowPageBreak: "avoid",
  });
  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  const narrativeTitle = addSectionTitle(doc, "Ringkasan Naratif", currentY);
  const narrativeParts = [
    ...classNarrative.goodNews,
    classNarrative.attention,
    ...(attentionStudents.length > 0
      ? [`Lihat bagian "Siswa yang Perlu Perhatian", halaman ${attentionPage}.`]
      : []),
    ...classNarrative.action,
  ].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const narrativeText = safeText(narrativeParts.join(" "));
  const narrativeLines = doc.splitTextToSize(narrativeText, 180) as string[];
  let narrativeY = narrativeTitle.startY + 1;
  for (const line of narrativeLines) {
    if (narrativeY > doc.internal.pageSize.height - 22) {
      doc.addPage();
      narrativeY = 20;
    }
    doc.text(line, 14, narrativeY);
    narrativeY += 4.5;
  }
  currentY = narrativeY + 5;

  const notesTitle = addSectionTitle(doc, "Catatan Cara Menghitung", currentY);
  const range = summary.rangeStart && summary.rangeEnd
    ? `${formatDate(summary.rangeStart)} – ${formatDate(summary.rangeEnd)}`
    : "Tidak ada rentang tanggal pada data";
  const notes = [
    `Cakupan: ${scope.description}`,
    `Data laporan: ${summary.totalSessions} sesi; rentang ${range}. Dibuat: ${reportTime}.`,
    metricNote("students"),
    metricNote("averageScore"),
    metricNote("attendance"),
    metricNote("sessions"),
    metricNote("scoreBySession"),
    metricNote("topStudents"),
    metricNote("hardestTopics"),
    metricNote("studentsNeedingAttention"),
    metricNote("studentsToMonitor"),
    `Keterbatasan identitas: ${metrics.students.filters}`,
  ];
  autoTable(doc, {
    startY: notesTitle.startY,
    body: notes.map((note) => [safeText(note)]),
    theme: "plain",
    styles: { fontSize: 7.5, cellPadding: 1.5, overflow: "linebreak", valign: "top", textColor: [65, 65, 65] },
    columnStyles: { 0: { cellWidth: 165 } },
    margin: { bottom: 22 },
    rowPageBreak: "avoid",
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(105);
    doc.text("Dokumen ini memuat data siswa; jangan dibagikan sembarangan.", 14, doc.internal.pageSize.height - 15);
    doc.setFontSize(8);
    doc.text(`Halaman ${page} dari ${pageCount} - Dibuat dengan Qurio`, 14, doc.internal.pageSize.height - 9);
  }

  return doc;
}

export function exportAnalyticsPDF(input: AnalyticsPDFInput) {
  const doc = createAnalyticsPDF(input);
  doc.save(`laporan-qurio-${new Date().toISOString().split("T")[0]}.pdf`);
}
