import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const frontendDir = path.resolve(import.meta.dirname, "..");
const tempDir = await mkdtemp(path.join(frontendDir, ".tmp-pdf-test-"));

function compileTypeScript(source, fileName) {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `TypeScript transpilation failed for ${fileName}`);
  return result.outputText;
}

try {
  const pdfSource = await readFile(path.join(frontendDir, "lib/export-pdf.ts"), "utf8");
  const selectionSource = await readFile(path.join(frontendDir, "lib/analytics-selection.ts"), "utf8");
  const pdfModulePath = path.join(tempDir, "export-pdf.mjs");
  const selectionModulePath = path.join(tempDir, "analytics-selection.mjs");
  const pdfModule = compileTypeScript(pdfSource, "lib/export-pdf.ts")
    .replace('import jsPDF from "jspdf";', 'import jspdfModule from "jspdf";\nconst jsPDF = jspdfModule.jsPDF ?? jspdfModule.default ?? jspdfModule;')
    .replace('from "./analytics-metrics.json";', 'from "./analytics-metrics.json" with { type: "json" };');
  await writeFile(pdfModulePath, pdfModule);
  await writeFile(selectionModulePath, compileTypeScript(selectionSource, "lib/analytics-selection.ts"));
  await copyFile(path.join(frontendDir, "lib/analytics-metrics.json"), path.join(tempDir, "analytics-metrics.json"));

  const [{ createAnalyticsPDF }, { selectQualifiedTopStudents }] = await Promise.all([
    import(pathToFileURL(pdfModulePath)),
    import(pathToFileURL(selectionModulePath)),
  ]);

  const profiles = Array.from({ length: 30 }, (_, index) => ({
    studentKey: `student-${index + 1}`,
    studentName: `Siswa Uji ${String(index + 1).padStart(2, "0")}`,
    average: 60 + (index % 25),
    sessionCount: index < 3 ? index + 1 : 3 + (index % 2),
  }));
  const qualified = selectQualifiedTopStudents(profiles, 3);
  assert.equal(qualified.length, 28);
  assert.ok(qualified.every((student) => student.sessionCount >= 3));
  const ranked = qualified.slice(0, 10).map((student, index) => ({
    rank: index + 1,
    name: student.studentName,
    sessionCount: student.sessionCount,
    value: `${student.average}%`,
  }));

  const question = `SOAL LENGKAP ${"teks soal panjang yang harus tetap utuh ".repeat(8)} AKHIR SOAL`;
  const base = {
    summary: {
      totalStudents: 30,
      averageScore: 73.4,
      scoreCorrectAnswers: 262,
      scoreGradedAnswers: 357,
      attendanceRate: 76.6666667,
      totalSessions: 4,
      attendanceBreakdown: [],
      rangeStart: "2026-09-06T05:06:44.000Z",
      rangeEnd: "2026-09-18T05:06:44.000Z",
    },
    classNarrative: {
      goodNews: ["Skor kelas memenuhi KKM 70%", "Kehadiran kelas memenuhi ambang", "4 sesi dianalisis"],
      attention: "2 siswa memenuhi kriteria Perlu Perhatian.",
      action: ["Pertimbangkan mengulang materi dari data topik."],
    },
    leaderboard: ranked,
    attentionStudents: Array.from({ length: 2 }, (_, index) => ({
      name: `Siswa Perhatian Uji ${index + 1}`,
      sessionsJoined: 1,
      averageScore: 55,
      reason: "Kehadiran 25% (di bawah 50%)",
      recommendation: "Tinjau kendala kehadiran siswa.",
    })),
    monitoredStudents: [{ name: "Siswa Pantau Uji", sessions: 2, averageScore: 55 }],
    topTopics: [{
      questionId: "question-1",
      questionText: question,
      sessionTitle: "IPA",
      incorrectRate: 75.4,
      totalAnswers: 20,
      incorrectAnswers: 15,
    }],
    teacherName: "Guru Uji",
  };

  async function writePdf(name, input) {
    const doc = createAnalyticsPDF(input);
    const buffer = Buffer.from(doc.output("arraybuffer"));
    assert.ok(buffer.toString("ascii", 0, 5) === "%PDF-");
    const pdfPath = path.join(tempDir, `${name}.pdf`);
    await writeFile(pdfPath, buffer);
    const pages = doc.getNumberOfPages();
    const text = doc.internal.pages.slice(1).flat().join("\n").replaceAll("\\(", "(").replaceAll("\\)", ")");
    return { pages, text };
  }

  const currentSized = await writePdf("current-30-siswa-4-sesi", base);
  assert.match(currentSized.text, /Ringkasan Kelas/);
  assert.match(currentSized.text, /Papan Peringkat Siswa/);
  assert.match(currentSized.text, /Siswa yang Perlu Perhatian/);
  assert.match(currentSized.text, /Perlu Dipantau \(data terbatas\)/);
  assert.match(currentSized.text, /halaman\s+\d+/i);
  assert.match(currentSized.text, /SOAL LENGKAP/);
  assert.match(currentSized.text, /AKHIR SOAL/);
  assert.match(currentSized.text, /Dokumen ini memuat data siswa; jangan dibagikan sembarangan\./);
  console.log(`PDF data 30 siswa/4 sesi: OK (${currentSized.pages} halaman)`);

  const empty = await writePdf("empty", {
    ...base,
    summary: { ...base.summary, totalStudents: 0, averageScore: 0, scoreCorrectAnswers: 0, scoreGradedAnswers: 0, attendanceRate: 0, totalSessions: 0, rangeStart: null, rangeEnd: null },
    classNarrative: { goodNews: [], attention: "Tidak ada data.", action: [] },
    leaderboard: [],
    attentionStudents: [],
    monitoredStudents: [],
    topTopics: [],
  });
  assert.ok(empty.pages >= 1);
  console.log(`PDF data kosong: OK (${empty.pages} halaman)`);

  const many = await writePdf("many-students", {
    ...base,
    attentionStudents: Array.from({ length: 125 }, (_, index) => ({
      name: `Siswa Perhatian Uji ${index + 1}`,
      sessionsJoined: index % 4,
      averageScore: 50,
      reason: "Rata-rata skor 50% (di bawah 60%)",
      recommendation: "Tinjau pemahaman materi dan berikan dukungan belajar.",
    })),
    monitoredStudents: Array.from({ length: 85 }, (_, index) => ({
      name: `Siswa Pantau Uji ${index + 1}`,
      sessions: (index % 2) + 1,
      averageScore: 55,
    })),
  });
  assert.ok(many.pages > currentSized.pages, `Expected long tables to span more pages (${many.pages} vs ${currentSized.pages})`);
  assert.match(many.text, /Siswa Perhatian Uji 125/);
  assert.match(many.text, /Siswa Pantau Uji 85/);
  console.log(`PDF daftar panjang: OK (${many.pages} halaman; seluruh baris ada)`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
