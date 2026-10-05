import pool from "../config/database/connection.js";

const PERIOD_DAYS = { "7d": 7, "30d": 30, "14d": 14, all: null };
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
  const rawLimit = req.query.limit ?? "5";
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    res.status(400).json({
      success: false,
      message: "Limit harus berupa bilangan bulat antara 1 dan 50.",
    });
    return undefined;
  }

  return limit;
}

function sendQueryError(res, context, error) {
  console.error(`${context}:`, error.message);
  return res.status(500).json({
    success: false,
    message: "Data analytics gagal dimuat.",
  });
}

// Return summary metrics scoped to the authenticated teacher's sessions.
export const getAnalyticsSummary = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;

  try {
    const result = await pool.query(
      `WITH scoped_sessions AS (
         SELECT id, title, class_size, created_at
         FROM sessions
         WHERE teacher_id = $1
           AND class_size IS NOT NULL
           AND (
             $2::int IS NULL
             OR created_at >= CURRENT_TIMESTAMP - ($2::int * INTERVAL '1 day')
           )
       ), per_session AS (
         SELECT
           s.id,
           s.title,
           s.class_size,
           COUNT(DISTINCT COALESCE(r.student_id::text, r.participant_id::text)) AS joined
         FROM scoped_sessions s
         LEFT JOIN polls p ON p.session_id = s.id
         LEFT JOIN responses r ON r.poll_id = p.id
         GROUP BY s.id, s.title, s.class_size
       ), attendance_agg AS (
         SELECT
           COALESCE(
             SUM(joined)::float / NULLIF(SUM(class_size), 0) * 100,
             0
           )::float AS "attendanceRate",
           COUNT(*)::int AS "sessionsWithClassSize",
           COALESCE(
             json_agg(
               json_build_object(
                 'sessionId', id,
                 'title', title,
                 'classSize', class_size,
                 'joined', joined,
                 'rate', ROUND(joined::numeric / NULLIF(class_size, 0) * 100, 1)
               ) ORDER BY (joined::float / NULLIF(class_size, 0)) ASC
             ),
             '[]'::json
           ) AS "attendanceBreakdown"
         FROM per_session
       ), all_sessions AS (
         SELECT s.id, s.created_at
         FROM sessions s
         WHERE s.teacher_id = $1 AND (
           $2::int IS NULL OR s.created_at >= CURRENT_TIMESTAMP - ($2::int * INTERVAL '1 day')
         )
       ), roster AS (
         SELECT
           p.session_id,
           LOWER(TRIM(p.name)) AS student_key
         FROM participants p
         JOIN all_sessions s ON s.id = p.session_id
         WHERE NULLIF(TRIM(p.name), '') IS NOT NULL
       ), engaged AS (
         SELECT DISTINCT s.id AS session_id,
           LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))) AS student_key
         FROM responses r
         JOIN polls poll ON poll.id = r.poll_id AND poll.type <> 'polling'
         JOIN all_sessions s ON s.id = poll.session_id
         LEFT JOIN participants participant ON participant.id = r.participant_id
         LEFT JOIN users u ON u.id = r.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name)), '') IS NOT NULL
         UNION
         SELECT DISTINCT s.id AS session_id,
           LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''), NULLIF(q.student_name, '')))) AS student_key
         FROM questions q
         JOIN all_sessions s ON s.id = q.session_id
         LEFT JOIN participants participant ON participant.id = q.participant_id
         LEFT JOIN users u ON u.id = q.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name, q.student_name)), '') IS NOT NULL
       ), score_metrics AS (
         SELECT AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END) AS average_score
         FROM responses r
         JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
         JOIN all_sessions s ON s.id = poll.session_id
         WHERE r.is_correct IS NOT NULL
       ), participation_metrics AS (
         SELECT
           COUNT(*)::int AS total_participants,
           COUNT(*) FILTER (WHERE engaged.student_key IS NOT NULL)::int AS engaged_participants,
           COUNT(DISTINCT roster.student_key)::int AS total_students
         FROM roster
         LEFT JOIN engaged
           ON engaged.session_id = roster.session_id
          AND engaged.student_key = roster.student_key
       )
       SELECT
         participation_metrics.total_students AS "totalStudents",
         COALESCE(ROUND(score_metrics.average_score, 1), 0)::float AS "averageScore",
         COALESCE(
           ROUND(
             100.0 * participation_metrics.engaged_participants
             / NULLIF(participation_metrics.total_participants, 0),
             1
           ),
           0
         )::float AS "participationRate",
         COALESCE(attendance_agg."attendanceRate", 0)::float AS "attendanceRate",
         COALESCE(attendance_agg."sessionsWithClassSize", 0)::int AS "sessionsWithClassSize",
         COALESCE(attendance_agg."attendanceBreakdown", '[]'::json) AS "attendanceBreakdown",
         (SELECT COUNT(*)::int FROM all_sessions) AS "totalSessions"
       FROM participation_metrics
       CROSS JOIN score_metrics
       LEFT JOIN attendance_agg ON TRUE`,
      [req.user.id, periodDays],
    );

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return sendQueryError(res, "Get analytics summary error", error);
  }
};

// Return quiz scores grouped by normalized student name and session.
export const getAnalyticsScores = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;

  try {
    const result = await pool.query(
      `SELECT
         LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))) AS "studentKey",
         MIN(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))) AS "studentName",
         s.id AS "sessionId",
         s.title AS "sessionTitle",
         ROUND(AVG(CASE WHEN r.is_correct THEN 100.0 ELSE 0.0 END), 1)::float AS score,
         COUNT(*) FILTER (WHERE r.is_correct)::int AS "correctCount",
         COUNT(*)::int AS "totalQuestions",
         MAX(r.submitted_at) AS "submittedAt"
       FROM responses r
       JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
       JOIN sessions s ON s.id = poll.session_id
       LEFT JOIN participants participant ON participant.id = r.participant_id
       LEFT JOIN users u ON u.id = r.student_id
       WHERE s.teacher_id = $1
         AND ${DATE_FILTER}
         AND r.is_correct IS NOT NULL
         AND NULLIF(TRIM(COALESCE(u.name, participant.name)), '') IS NOT NULL
       GROUP BY
         LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))),
         s.id,
         s.title
       ORDER BY s.created_at DESC, score DESC, "studentName" ASC`,
      [req.user.id, periodDays],
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics scores error", error);
  }
};

// Return activity counts per normalized student name, excluding polling votes.
export const getAnalyticsStudents = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;

  try {
    const result = await pool.query(
      `WITH scoped_sessions AS (
         SELECT s.id, s.created_at
         FROM sessions s
         WHERE s.teacher_id = $1 AND ${DATE_FILTER}
       ), participant_rows AS (
         SELECT
           LOWER(TRIM(p.name)) AS student_key,
           TRIM(p.name) AS student_name,
           p.session_id
         FROM participants p
         JOIN scoped_sessions s ON s.id = p.session_id
         WHERE NULLIF(TRIM(p.name), '') IS NOT NULL
       ), question_rows AS (
         SELECT
           LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''), NULLIF(q.student_name, '')))) AS student_key,
           TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''), NULLIF(q.student_name, ''))) AS student_name,
           q.id AS question_id
         FROM questions q
         JOIN scoped_sessions s ON s.id = q.session_id
         LEFT JOIN participants participant ON participant.id = q.participant_id
         LEFT JOIN users u ON u.id = q.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name, q.student_name)), '') IS NOT NULL
       ), response_rows AS (
         SELECT
           LOWER(TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, '')))) AS student_key,
           TRIM(COALESCE(NULLIF(u.name, ''), NULLIF(participant.name, ''))) AS student_name,
           r.id AS response_id
         FROM responses r
         JOIN polls poll ON poll.id = r.poll_id AND poll.type <> 'polling'
         JOIN scoped_sessions s ON s.id = poll.session_id
         LEFT JOIN participants participant ON participant.id = r.participant_id
         LEFT JOIN users u ON u.id = r.student_id
         WHERE NULLIF(TRIM(COALESCE(u.name, participant.name)), '') IS NOT NULL
       ), identity_rows AS (
         SELECT student_key, student_name FROM participant_rows
         UNION ALL
         SELECT student_key, student_name FROM question_rows
         UNION ALL
         SELECT student_key, student_name FROM response_rows
       ), student_names AS (
         SELECT student_key, MIN(student_name) AS student_name
         FROM identity_rows
         GROUP BY student_key
       ), session_counts AS (
         SELECT student_key, COUNT(DISTINCT session_id)::int AS sessions_joined
         FROM participant_rows
         GROUP BY student_key
       ), question_counts AS (
         SELECT student_key, COUNT(*)::int AS questions_asked
         FROM question_rows
         GROUP BY student_key
       ), response_counts AS (
         SELECT student_key, COUNT(*)::int AS responses_submitted
         FROM response_rows
         GROUP BY student_key
       )
       SELECT
         student_names.student_key AS "studentKey",
         student_names.student_name AS "studentName",
         COALESCE(session_counts.sessions_joined, 0)::int AS "sessionsJoined",
         COALESCE(question_counts.questions_asked, 0)::int AS "questionsAsked",
         COALESCE(response_counts.responses_submitted, 0)::int AS "responsesSubmitted"
       FROM student_names
       LEFT JOIN session_counts USING (student_key)
       LEFT JOIN question_counts USING (student_key)
       LEFT JOIN response_counts USING (student_key)
       ORDER BY "responsesSubmitted" DESC, "questionsAsked" DESC, "studentName" ASC`,
      [req.user.id, periodDays],
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics students error", error);
  }
};

// Return quiz questions with at least five scored answers, ordered by error rate.
export const getAnalyticsTopics = async (req, res) => {
  const periodDays = parsePeriod(req, res);
  if (periodDays === undefined) return;
  const limit = getLimit(req, res);
  if (limit === undefined) return;

  try {
    const result = await pool.query(
      `SELECT
         poll.id AS "questionId",
         poll.question AS "questionText",
         s.title AS "sessionTitle",
         ROUND(
           100.0 * COUNT(*) FILTER (WHERE r.is_correct = FALSE)
           / NULLIF(COUNT(*), 0),
           1
         )::float AS "incorrectRate",
         COUNT(*)::int AS "totalAnswers"
       FROM responses r
       JOIN polls poll ON poll.id = r.poll_id AND poll.type = 'quiz'
       JOIN sessions s ON s.id = poll.session_id
       WHERE s.teacher_id = $1
         AND ${DATE_FILTER}
         AND r.is_correct IS NOT NULL
       GROUP BY poll.id, poll.question, s.title, s.created_at
       HAVING COUNT(*) >= 5
       ORDER BY "incorrectRate" DESC, "totalAnswers" DESC, poll.question ASC
       LIMIT $3`,
      [req.user.id, periodDays, limit],
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics topics error", error);
  }
};

// Return average quiz scores grouped by session.
export const getAnalyticsScoreBySession = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id AS "sessionId",
         s.title AS "sessionTitle",
         s.created_at AS "createdAt",
         ROUND(
           COUNT(*) FILTER (WHERE r.is_correct = true)::numeric
           / NULLIF(COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL), 0)
           * 100,
           1
         )::float AS "avgScore",
         COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL)::int AS "totalAnswers"
       FROM sessions s
       JOIN polls p ON p.session_id = s.id AND p.type = 'quiz'
       JOIN responses r ON r.poll_id = p.id
       WHERE s.teacher_id = $1
         AND r.is_correct IS NOT NULL
       GROUP BY s.id, s.title, s.created_at
       HAVING COUNT(*) FILTER (WHERE r.is_correct IS NOT NULL) >= 5
       ORDER BY s.created_at ASC`,
      [req.user.id],
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    return sendQueryError(res, "Get analytics score by session error", error);
  }
};
