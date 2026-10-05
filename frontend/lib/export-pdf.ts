import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface AnalyticsSummaryPDF {
  totalStudents: number;
  averageScore: number;
  attendanceRate: number;
  totalSessions: number;
}

interface LeaderboardRowPDF {
  rank: number;
  name: string;
  detail: string;
  value: string;
}

interface TopTopicPDF {
  questionText: string;
  sessionTitle: string;
  incorrectRate: number;
  totalAnswers: number;
}

// Helvetica in jsPDF does not include several Greek and math glyphs.
const sanitizeForPDF = (text: string) =>
  text
    .replace(/θ/g, "theta")
    .replace(/α/g, "alpha")
    .replace(/β/g, "beta")
    .replace(/π/g, "pi")
    .replace(/√/g, "akar")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3");

export function exportAnalyticsPDF({
  summary,
  narrative,
  leaderboard,
  topTopics,
  teacherName,
}: {
  summary: AnalyticsSummaryPDF;
  narrative: string;
  leaderboard: LeaderboardRowPDF[];
  topTopics: TopTopicPDF[];
  teacherName: string;
}) {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Analitik Kelas", 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Guru: ${teacherName}`, 14, 28);
  doc.text(`Tanggal: ${today}`, 14, 34);
  doc.setTextColor(0);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Kelas", 14, 48);

  autoTable(doc, {
    startY: 52,
    head: [["Metrik", "Nilai"]],
    body: [
      ["Total Siswa", String(summary.totalStudents)],
      ["Rata-rata Skor Kuis", `${Math.round(summary.averageScore)}%`],
      ["Tingkat Kehadiran", `${Math.round(summary.attendanceRate)}%`],
      ["Sesi Dianalisis", String(summary.totalSessions)],
    ],
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  let currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Naratif", 14, currentY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const narrativeLines = doc.splitTextToSize(
    sanitizeForPDF(narrative),
    180,
  ) as string[];
  const narrativeHeight = narrativeLines.length * 5;
  if (currentY + 6 + narrativeHeight > doc.internal.pageSize.height - 18) {
    doc.addPage();
    currentY = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Ringkasan Naratif", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }
  doc.text(narrativeLines, 14, currentY + 6);
  currentY += 6 + narrativeHeight + 8;

  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Papan Peringkat Siswa (10 Teratas)", 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["#", "Nama Siswa", "Detail", "Nilai"]],
    body: leaderboard.slice(0, 10).map((row) => [
      String(row.rank),
      sanitizeForPDF(row.name),
      sanitizeForPDF(row.detail),
      sanitizeForPDF(row.value),
    ]),
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129] },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 100 },
      3: { cellWidth: 30, halign: "right" },
    },
  });

  currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 12;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Topik Paling Sulit (5 Teratas)", 14, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Soal", "Sesi", "% Salah", "Jawaban"]],
    body: topTopics.slice(0, 5).map((topic) => [
      sanitizeForPDF(topic.questionText),
      sanitizeForPDF(topic.sessionTitle),
      `${Math.round(topic.incorrectRate)}%`,
      String(topic.totalAnswers),
    ]),
    theme: "grid",
    headStyles: { fillColor: [239, 68, 68] },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 50 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(
      `Halaman ${page} dari ${pageCount} - Dibuat dengan Qurio`,
      14,
      doc.internal.pageSize.height - 10,
    );
  }

  const filename = `laporan-qurio-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
