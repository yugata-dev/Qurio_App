import pool from "../config/database/connection.js";
import metrics from "../config/analytics-metrics.json" with { type: "json" };

const PERIOD_DAYS = { "7d": 7, "30d": 30, "14d": 14, all: null };
const MINIMUM_CHART_ANSWERS = metrics.thresholds.minimumAnswersForChart;
const MINIMUM_STUDENT_SESSIONS = metrics.thresholds.minimumStudentSessions;
const LOW_STUDENT_SCORE = metrics.thresholds.lowScore;
const LOW_ATTENDANCE_PERCENT = metrics.thresholds.lowAttendancePercent;
const DATE_FILTER = `(
  $2::int IS NULL OR s.created_at >= CURRENT_TIMESTAMP - ($2::int * INTERVAL '1 day')
)`;

function parsePeriod(req, res, allowedPeriods = ["7d", "30d", "all"]) {
  const period = req.query.period ?? "7d";
  if (typeof period !== "string" || !allowedPeriods.includes(period)) {
    res.status(400).json({
      success: false,
      message: `Period tidak valid. Pilihan: ${allowedPeriods.join(", ")}.`,
    });
    return undefined;
  }
  return PERIOD_DAYS[period];
}

function getLimit(req, res) {
  const limit = Number(req.query.limit ?? String(metrics.thresholds.maximumTopicsDisplayed));
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    res.status(400).json({ success: false, message: "Limit harus berupa bilangan bulat antara 1 dan 50." });
    return undefined;
  }
  return limit;
}

function sendQueryError(res, context, error) {
  console.error(`${context}:`, error.message);
  return res.status(500).json({ success: false, message: "Data analytics gagal dimuat." });
}

const SCOPED_SESSIONS_CTE = `
  scoped_sessions AS (
    SELECT s.id, s.title, s.class_size, s.created_at
    FROM sessions s
    WHERE s.teacher_id = $1
      AND s.mode = 'quiz'
      AND ${DATE_FILTER}
      AND EXISTS (
        SELECT 1
        FROM polls eligible_poll
        JOIN responses eligible_response ON eligible_response.poll_id = eligible_poll.id
        WHERE eligible_poll.session_id = s.id
          AND eligible_poll.type = 'quiz'
          AND eligible_response.is_correct IS NOT NULL
      )
  )`;

const RESPONSE_NAME = `LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''))))`;

export const getAnalyticsSummary = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  try {
    const result = await pool.query(
      `WITH ${SCOPED_SESSIONS_CTE}, scored_responses AS (
         SELECT r.id, r.is_correct, poll.session_id,
           ${RESPONSE_NAME} AS student_key
         FROM responses r
         JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
         JOIN scoped_sessions s ON s.id = poll.session_id
         LEFT JOIN participants participant ON participant.id = r.participant_id
         LEFT JOIN users u ON u.id = r.student_id
         WHERE r.is_correct IS NOT NULL
       ), per_session AS (
         SELECT s.id, s.title, s.class_size,
           COUNT(DISTINCT r.student_key) FILTER (WHERE r.student_key <> '')::int AS joined,
           COUNT(r.id)::int AS scored_answers
         FROM scoped_sessions s
         JOIN scored_responses r ON r.session_id = s.id
         GROUP BY s.id, s.title, s.class_size
       ), attendance_agg AS (
         SELECT COALESCE(AVG(LEAST(100, joined::numeric / NULLIF(class_size, 0) * 100)), 0)::float AS attendance_rate,
           COALESCE(json_agg(json_build_object(
             'sessionId', id, 'title', title, 'classSize', class_size, 'joined', joined,
             'rate', ROUND(LEAST(100, joined::numeric / NULLIF(class_size, 0) * 100), 1),
             'overCapacity', joined > class_size
           ) ORDER BY (joined::float / NULLIF(class_size, 0)) ASC), '[]'::json) AS attendance_breakdown
         FROM per_session
       ), range_data AS (
         SELECT MIN(created_at) AS range_start, MAX(created_at) AS range_end FROM scoped_sessions
       )
       SELECT
         (SELECT COUNT(DISTINCT student_key)::int FROM scored_responses WHERE student_key <> '') AS "totalStudents",
         COALESCE(ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 1), 0)::float AS "averageScore",
         COUNT(*) FILTER (WHERE is_correct)::int AS "scoreCorrectAnswers",
         COUNT(*)::int AS "scoreGradedAnswers",
         COALESCE((SELECT attendance_rate FROM attendance_agg), 0)::float AS "attendanceRate",
         COALESCE((SELECT attendance_breakdown FROM attendance_agg), '[]'::json) AS "attendanceBreakdown",
         (SELECT COUNT(*)::int FROM scoped_sessions) AS "totalSessions",
         (SELECT MIN(range_start) FROM range_data) AS "rangeStart",
         (SELECT MAX(range_end) FROM range_data) AS "rangeEnd"
       FROM scored_responses`,
      [req.user.id, periodDays],
    );
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return sendQueryError(res, "Get analytics summary error", error);
  }
};

export const getAnalyticsScores = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  try {
    const result = await pool.query(
      `WITH ${SCOPED_SESSIONS_CTE}
       SELECT ${RESPONSE_NAME} AS "studentKey",
         MIN(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))) AS "studentName",
         s.id AS "sessionId", s.title AS "sessionTitle",
         ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 1)::float AS score,
         COUNT(*) FILTER (WHERE r.is_correct)::int AS "correctCount",
         COUNT(*)::int AS "totalQuestions",
         MAX(r.submitted_at) AS "submittedAt"
       FROM responses r
       JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
       JOIN scoped_sessions s ON s.id = poll.session_id
       LEFT JOIN participants participant ON participant.id = r.participant_id
       LEFT JOIN users u ON u.id = r.student_id
       WHERE r.is_correct IS NOT NULL
         AND NULLIF(TRIM(COALESCE(u.name, participant.name)), '') IS NOT NULL
       GROUP BY ${RESPONSE_NAME}, s.id, s.title, s.created_at
       ORDER BY s.created_at DESC, score DESC, "studentName" ASC`,
      [req.user.id, periodDays],
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics scores error", error);
  }
};

export const getAnalyticsStudents = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  try {
    const result = await pool.query(
      `WITH ${SCOPED_SESSIONS_CTE}, participant_rows AS (
         SELECT LOWER(TRIM(p.name)) AS student_key, TRIM(p.name) AS student_name, p.session_id
         FROM participants p JOIN scoped_sessions s ON s.id = p.session_id
         WHERE NULLIF(TRIM(p.name), '') IS NOT NULL
       ), question_rows AS (
         SELECT LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''), NULLIF(q.student_name, '')))) AS student_key,
           TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''), NULLIF(q.student_name, ''))) AS student_name,
           q.id AS question_id, q.session_id
         FROM questions q JOIN scoped_sessions s ON s.id = q.session_id
         LEFT JOIN participants participant ON participant.id = q.participant_id
         LEFT JOIN users u ON u.id = q.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name, q.student_name)), '') IS NOT NULL
       ), response_rows AS (
         SELECT ${RESPONSE_NAME} AS student_key,
           TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''))) AS student_name,
           r.id AS response_id, poll.session_id, r.is_correct
         FROM responses r JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
         JOIN scoped_sessions s ON s.id = poll.session_id
         LEFT JOIN participants participant ON participant.id = r.participant_id
         LEFT JOIN users u ON u.id = r.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name)), '') IS NOT NULL
       ), identity_rows AS (
         SELECT student_key, student_name FROM participant_rows
         UNION ALL SELECT student_key, student_name FROM question_rows
         UNION ALL SELECT student_key, student_name FROM response_rows
       ), student_names AS (
         SELECT student_key, MIN(student_name) AS student_name FROM identity_rows GROUP BY student_key
       ), session_counts AS (
         SELECT student_key, COUNT(DISTINCT session_id)::int AS sessions_joined
         FROM response_rows WHERE is_correct IS NOT NULL GROUP BY student_key
       ), per_student_session_score AS (
         SELECT student_key, session_id,
           ROUND(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END)::numeric, 1) AS session_score
         FROM response_rows WHERE is_correct IS NOT NULL GROUP BY student_key, session_id
       ), score_profiles AS (
         SELECT student_key, ROUND(AVG(session_score))::int AS average_score,
           COUNT(*)::int AS score_sessions
         FROM per_student_session_score GROUP BY student_key
       ), question_counts AS (
         SELECT student_key, COUNT(*)::int AS questions_asked FROM question_rows GROUP BY student_key
       ), response_counts AS (
         SELECT student_key, COUNT(*)::int AS responses_submitted FROM response_rows GROUP BY student_key
       )
       SELECT student_names.student_key AS "studentKey", student_names.student_name AS "studentName",
         COALESCE(session_counts.sessions_joined, 0)::int AS "sessionsJoined",
         COALESCE(question_counts.questions_asked, 0)::int AS "questionsAsked",
         COALESCE(response_counts.responses_submitted, 0)::int AS "responsesSubmitted",
         score_profiles.average_score AS "averageScore",
         COALESCE(score_profiles.score_sessions, 0)::int AS "scoreSessions",
         COALESCE(session_counts.sessions_joined, 0)::float * 100 /
           NULLIF((SELECT COUNT(*) FROM scoped_sessions), 0) AS "attendanceRate",
         (COALESCE(score_profiles.score_sessions, 0) >= ${MINIMUM_STUDENT_SESSIONS}
           AND score_profiles.average_score < ${LOW_STUDENT_SCORE})
           OR ((SELECT COUNT(*) FROM scoped_sessions) >= ${MINIMUM_STUDENT_SESSIONS}
             AND COALESCE(session_counts.sessions_joined, 0)::float * 100 /
               NULLIF((SELECT COUNT(*) FROM scoped_sessions), 0) < ${LOW_ATTENDANCE_PERCENT}) AS "needsAttention"
       FROM student_names LEFT JOIN session_counts USING (student_key)
       LEFT JOIN question_counts USING (student_key) LEFT JOIN response_counts USING (student_key)
       LEFT JOIN score_profiles USING (student_key)
       ORDER BY "responsesSubmitted" DESC, "questionsAsked" DESC, "studentName" ASC`,
      [req.user.id, periodDays],
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics students error", error);
  }
};

export const getAnalyticsTopics = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  const limit = getLimit(req, res);
  if (limit === undefined) return;
  try {
    const result = await pool.query(
      `WITH ${SCOPED_SESSIONS_CTE}
       SELECT poll.id AS "questionId", poll.question AS "questionText", s.title AS "sessionTitle",
         ROUND(100.0 * COUNT(*) FILTER (WHERE r.is_correct = FALSE) / NULLIF(COUNT(*), 0), 1)::float AS "incorrectRate",
         COUNT(*)::int AS "totalAnswers",
         COUNT(*) FILTER (WHERE r.is_correct = FALSE)::int AS "incorrectAnswers"
       FROM responses r JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
       JOIN scoped_sessions s ON s.id = poll.session_id
       WHERE r.is_correct IS NOT NULL
       GROUP BY poll.id, poll.question, s.title, s.created_at
       HAVING COUNT(*) >= ${MINIMUM_CHART_ANSWERS}
       ORDER BY "incorrectRate" DESC, "totalAnswers" DESC, poll.question ASC
       LIMIT $3`,
      [req.user.id, periodDays, limit],
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics topics error", error);
  }
};

export const getAnalyticsScoreBySession = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  try {
    const result = await pool.query(
      `WITH ${SCOPED_SESSIONS_CTE}
       SELECT s.id AS "sessionId", s.title AS "sessionTitle", s.created_at AS "createdAt",
         ROUND(COUNT(*) FILTER (WHERE r.is_correct = true)::numeric /
           NULLIF(COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL), 0) * 100, 1)::float AS "avgScore",
         COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL)::int AS "totalAnswers",
         COUNT(*) FILTER (WHERE r.is_correct = true)::int AS "correctAnswers"
       FROM scoped_sessions s JOIN polls p ON p.session_id = s.id AND p.type = 'quiz'
       JOIN responses r ON r.poll_id = p.id
       WHERE r.is_correct IS NOT NULL
       GROUP BY s.id, s.title, s.created_at
       HAVING COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL) >= ${MINIMUM_CHART_ANSWERS}
       ORDER BY s.created_at ASC`,
      [req.user.id, periodDays],
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics score by session error", error);
  }
};
