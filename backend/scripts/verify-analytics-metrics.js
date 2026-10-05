import pool from "../src/config/database/connection.js";
import metrics from "../src/config/analytics-metrics.json" with { type: "json" };
import {
  getAnalyticsScores,
  getAnalyticsScoreBySession,
  getAnalyticsStudents,
  getAnalyticsSummary,
  getAnalyticsTopics,
} from "../src/controllers/analytics.controller.js";

const teacherId = process.env.ANALYTICS_TEACHER_ID;

async function readDirectMetrics(id) {
  const result = await pool.query(
    `WITH scoped AS (
       SELECT s.id, s.class_size, s.created_at
       FROM sessions s
       WHERE s.teacher_id = $1 AND s.mode = 'quiz'
         AND EXISTS (
           SELECT 1 FROM polls p JOIN responses r ON r.poll_id = p.id
           WHERE p.session_id = s.id AND p.type = 'quiz' AND r.is_correct IS NOT NULL
         )
     ), scored AS (
       SELECT s.id AS session_id, s.class_size, r.is_correct,
         LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(pt.name, '')))) AS student_key
       FROM scoped s
       JOIN polls p ON p.session_id = s.id AND p.type = 'quiz'
       JOIN responses r ON r.poll_id = p.id AND r.is_correct IS NOT NULL
       LEFT JOIN participants pt ON pt.id = r.participant_id
       LEFT JOIN users u ON u.id = r.student_id
     ), session_attendance AS (
       SELECT scoped.id, scoped.class_size,
         COUNT(DISTINCT scored.student_key) FILTER (WHERE scored.student_key <> '') AS joined
       FROM scoped JOIN scored ON scored.session_id = scoped.id
       GROUP BY scoped.id, scoped.class_size
     )
     SELECT
       (SELECT COUNT(*)::int FROM scoped) AS sessions,
       (SELECT COUNT(DISTINCT student_key)::int FROM scored WHERE student_key <> '') AS students,
       COUNT(*) FILTER (WHERE is_correct)::int AS correct,
       COUNT(*)::int AS graded,
       COALESCE(ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 1), 0)::float AS average_score,
       COALESCE((SELECT AVG(LEAST(100, joined::numeric / NULLIF(class_size, 0) * 100))::float FROM session_attendance), 0)::float AS attendance,
       (SELECT COUNT(*)::int FROM session_attendance WHERE joined > class_size) AS over_capacity_sessions,
       (SELECT MIN(created_at) FROM scoped) AS range_start,
       (SELECT MAX(created_at) FROM scoped) AS range_end
     FROM scored`,
    [id],
  );
  return result.rows[0];
}

async function readDirectCharts(id) {
  const result = await pool.query(
    `WITH scoped AS (
       SELECT s.id, s.title, s.created_at FROM sessions s
       WHERE s.teacher_id = $1 AND s.mode = 'quiz' AND EXISTS (
         SELECT 1 FROM polls p JOIN responses r ON r.poll_id = p.id
         WHERE p.session_id = s.id AND p.type = 'quiz' AND r.is_correct IS NOT NULL
       )
     ), session_scores AS (
       SELECT s.id AS session_id, s.title, s.created_at,
         COUNT(*) FILTER (WHERE r.is_correct)::int AS correct,
         COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL)::int AS total
       FROM scoped s JOIN polls p ON p.session_id = s.id AND p.type = 'quiz'
       JOIN responses r ON r.poll_id = p.id
       WHERE r.is_correct IS NOT NULL
       GROUP BY s.id, s.title, s.created_at
       HAVING COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL) >= $2
     ), topic_scores AS (
       SELECT poll.id AS question_id, poll.question, s.title AS session_title,
         ROUND(100.0 * COUNT(*) FILTER (WHERE r.is_correct = FALSE) / NULLIF(COUNT(*), 0), 1)::float AS incorrect_rate,
         COUNT(*)::int AS total
       FROM responses r JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
       JOIN scoped s ON s.id = poll.session_id
       WHERE r.is_correct IS NOT NULL
       GROUP BY poll.id, poll.question, s.title, s.created_at
       HAVING COUNT(*) >= $2
       ORDER BY incorrect_rate DESC, total DESC, poll.question ASC
       LIMIT $3
     )
     SELECT (SELECT COUNT(*)::int FROM session_scores) AS eligible_score_sessions,
       (SELECT COALESCE(SUM(total), 0)::int FROM session_scores) AS chart_answers,
       (SELECT COUNT(*)::int FROM topic_scores) AS eligible_topics,
       (SELECT COALESCE(SUM(total), 0)::int FROM topic_scores) AS topic_answers`,
    [id, metrics.thresholds.minimumAnswersForChart, metrics.thresholds.maximumTopicsDisplayed],
  );
  return result.rows[0];
}

async function callSummaryApi(id) {
  let statusCode = 200;
  let payload;
  await getAnalyticsSummary(
    { user: { id }, query: { period: "all" } },
    {
      status(code) { statusCode = code; return this; },
      json(body) { payload = body; return this; },
    },
  );
  if (statusCode !== 200 || !payload?.success) {
    throw new Error(`Summary API gagal (HTTP ${statusCode}).`);
  }
  return payload.data;
}

async function callListApi(handler, id) {
  let statusCode = 200;
  let payload;
  await handler(
    { user: { id }, query: { period: "all" } },
    {
      status(code) { statusCode = code; return this; },
      json(body) { payload = body; return this; },
    },
  );
  if (statusCode !== 200 || !payload?.success) throw new Error(`Analytics list API gagal (HTTP ${statusCode}).`);
  return payload.data;
}

function classifyAttentionFixture({ classSessions, scoreSessions, averageScore, sessionsJoined }) {
  const scoreAttention = scoreSessions >= metrics.thresholds.minimumStudentSessions &&
    averageScore < metrics.thresholds.lowScore;
  const attendanceRate = classSessions > 0 ? sessionsJoined / classSessions * 100 : 0;
  const attendanceAttention = classSessions >= metrics.thresholds.minimumStudentSessions &&
    attendanceRate < metrics.thresholds.lowAttendancePercent;
  const needsAttention = scoreAttention || attendanceAttention;
  const needsMonitoring = !needsAttention &&
    scoreSessions >= 1 &&
    scoreSessions <= metrics.thresholds.monitoringMaximumSessions &&
    averageScore < metrics.thresholds.lowScore;
  return { needsAttention, needsMonitoring };
}

function equalNumber(label, direct, api, tolerance = 0.11) {
  const difference = Math.abs(Number(direct ?? 0) - Number(api ?? 0));
  console.log(`${label}: langsung=${direct} API=${api} selisih=${difference.toFixed(4)} ${difference <= tolerance ? "OK" : "SELISIH"}`);
  return difference <= tolerance;
}

try {
  const bucketFixtures = [
    {
      name: "Skor rendah, 2 sesi masuk Perlu Dipantau",
      input: { classSessions: 4, scoreSessions: 2, averageScore: 55, sessionsJoined: 2 },
      attention: false,
      monitoring: true,
    },
    {
      name: "Skor rendah, 3 sesi masuk Perlu Perhatian",
      input: { classSessions: 4, scoreSessions: 3, averageScore: 55, sessionsJoined: 3 },
      attention: true,
      monitoring: false,
    },
    {
      name: "Skor tinggi, hadir 1 dari 4 sesi masuk Perlu Perhatian",
      input: { classSessions: 4, scoreSessions: 1, averageScore: 85, sessionsJoined: 1 },
      attention: true,
      monitoring: false,
    },
  ];
  const bucketFixturesPass = bucketFixtures.every(({ name, input, attention, monitoring }) => {
    const result = classifyAttentionFixture(input);
    const passes = result.needsAttention === attention && result.needsMonitoring === monitoring;
    console.log(`Fixture ${name}: ${passes ? "OK" : "GAGAL"}`);
    return passes;
  });
  if (!bucketFixturesPass) process.exitCode = 1;

  const id = teacherId ?? (await pool.query(
    `SELECT u.id FROM users u
     WHERE u.role = 'guru' AND EXISTS (
       SELECT 1 FROM sessions s JOIN polls p ON p.session_id = s.id AND p.type = 'quiz'
       JOIN responses r ON r.poll_id = p.id AND r.is_correct IS NOT NULL
       WHERE s.teacher_id = u.id AND s.mode = 'quiz'
     ) ORDER BY u.created_at LIMIT 1`,
  )).rows[0]?.id;

  if (!id) {
    console.log("Tidak ada data Quiz berjawaban dinilai untuk diverifikasi.");
    process.exitCode = 2;
  } else {
    const [direct, directCharts, api, scores, students, scoreChart, topics] = await Promise.all([
      readDirectMetrics(id),
      readDirectCharts(id),
      callSummaryApi(id),
      callListApi(getAnalyticsScores, id),
      callListApi(getAnalyticsStudents, id),
      callListApi(getAnalyticsScoreBySession, id),
      callListApi(getAnalyticsTopics, id),
    ]);
    const matches = [
      equalNumber("Sesi dianalisis", direct.sessions, api.totalSessions, 0),
      equalNumber("Total siswa bernama", direct.students, api.totalStudents, 0),
      equalNumber("Jawaban benar", direct.correct, api.scoreCorrectAnswers, 0),
      equalNumber("Jawaban dinilai", direct.graded, api.scoreGradedAnswers, 0),
      equalNumber("Rata-rata skor (%)", direct.average_score, api.averageScore, 0.001),
      equalNumber("Rata-rata kehadiran (%)", direct.attendance, api.attendanceRate, 0.001),
    ];
    const sameRange = String(direct.range_start ?? "") === String(api.rangeStart ?? "") &&
      String(direct.range_end ?? "") === String(api.rangeEnd ?? "");
    console.log(`Rentang tanggal: langsung=${direct.range_start ?? "kosong"}..${direct.range_end ?? "kosong"} API=${api.rangeStart ?? "kosong"}..${api.rangeEnd ?? "kosong"} ${sameRange ? "OK" : "SELISIH"}`);
    const scoresByName = new Map();
    for (const score of scores) {
      const values = scoresByName.get(score.studentKey) ?? [];
      values.push(score.score);
      scoresByName.set(score.studentKey, values);
    }
    const scoreMismatches = students.filter((student) => {
      const values = scoresByName.get(student.studentKey);
      if (!values?.length) return student.scoreSessions !== 0 || student.averageScore !== null;
      const directAverage = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
      const scoreAttention = values.length >= metrics.thresholds.minimumStudentSessions &&
        directAverage < metrics.thresholds.lowScore;
      const attendanceAttention = direct.sessions >= metrics.thresholds.minimumStudentSessions &&
        Number(student.attendanceRate ?? 0) < metrics.thresholds.lowAttendancePercent;
      const attentionExpected = scoreAttention || attendanceAttention;
      return student.scoreSessions !== values.length || student.averageScore !== directAverage ||
        student.needsAttention !== attentionExpected;
    }).length;
    console.log(`Profil siswa skor/sesi/Perlu Perhatian: ${scoreMismatches} selisih dari ${students.length} profil API ${scoreMismatches === 0 ? "OK" : "SELISIH"}`);
    const scoreChartTotal = scoreChart.reduce((sum, item) => sum + item.totalAnswers, 0);
    const topicAnswerTotal = topics.reduce((sum, item) => sum + item.totalAnswers, 0);
    const chartChecks = [
      equalNumber("Sesi masuk grafik skor (>= ambang jawaban)", directCharts.eligible_score_sessions, scoreChart.length, 0),
      equalNumber("Jawaban pada grafik skor", directCharts.chart_answers, scoreChartTotal, 0),
      equalNumber("Topik terpilih (maks. 5)", directCharts.eligible_topics, topics.length, 0),
      equalNumber("Jawaban pada topik terpilih", directCharts.topic_answers, topicAnswerTotal, 0),
    ];
    const overCapacityRows = api.attendanceBreakdown.filter((row) => row.overCapacity);
    const cappedRows = api.attendanceBreakdown.every((row) => row.rate <= 100);
    const overCapacityMatches = direct.over_capacity_sessions === overCapacityRows.length &&
      api.attendanceBreakdown.every((row) => row.overCapacity === (row.joined > row.classSize));
    console.log(`Sesi responden melebihi kapasitas: langsung=${direct.over_capacity_sessions} API=${overCapacityRows.length} ${overCapacityMatches ? "OK" : "SELISIH"}`);
    console.log(`Semua rate sesi <=100%: ${cappedRows ? "OK" : "SELISIH"}`);

    const lowAttendanceLowSample = students.filter((student) =>
      direct.sessions >= metrics.thresholds.minimumStudentSessions &&
      student.sessionsJoined < metrics.thresholds.minimumStudentSessions &&
      Number(student.attendanceRate ?? 0) < metrics.thresholds.lowAttendancePercent,
    );
    const lowSampleFlagsMatch = lowAttendanceLowSample.every((student) => student.needsAttention);
    console.log(`Siswa hadir rendah dengan <${metrics.thresholds.minimumStudentSessions} sesi siswa: ${lowAttendanceLowSample.length} data nyata; flag API ${lowSampleFlagsMatch ? "OK" : "SELISIH"}`);

    const lowAttendanceFixture = {
      classSessions: metrics.thresholds.minimumStudentSessions,
      studentSessions: 1,
      attendanceRate: 100 / metrics.thresholds.minimumStudentSessions,
      scoreSessions: 1,
      averageScore: metrics.thresholds.passingScore,
    };
    const lowAttendanceFixturePasses =
      lowAttendanceFixture.classSessions >= metrics.thresholds.minimumStudentSessions &&
      lowAttendanceFixture.attendanceRate < metrics.thresholds.lowAttendancePercent &&
      !(lowAttendanceFixture.scoreSessions >= metrics.thresholds.minimumStudentSessions &&
        lowAttendanceFixture.averageScore < metrics.thresholds.lowScore);
    const capacityFixture = { respondents: 35, classSize: 30 };
    const cappedFixtureRate = Math.min(100, capacityFixture.respondents / capacityFixture.classSize * 100);
    const capacityFixturePasses = cappedFixtureRate === 100 && capacityFixture.respondents > capacityFixture.classSize;
    console.log(`Fixture hadir rendah (<3 sesi siswa): ${lowAttendanceFixturePasses ? "OK" : "GAGAL"}`);
    console.log(`Fixture responden 35 / class_size 30: rate=${cappedFixtureRate}% dan warning=${capacityFixture.respondents > capacityFixture.classSize ? "OK" : "GAGAL"}`);

    if (!sameRange || matches.includes(false) || chartChecks.includes(false) || scoreMismatches > 0 ||
      !overCapacityMatches || !cappedRows || !lowSampleFlagsMatch ||
      !lowAttendanceFixturePasses || !capacityFixturePasses) process.exitCode = 1;
  }
} catch (error) {
  console.error(`Verifikasi analytics gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
