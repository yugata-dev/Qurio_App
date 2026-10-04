-- Tambah kolom mode di sessions: "quiz" atau "interactive"
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS mode VARCHAR(20) CHECK (
    mode IN ('interactive', 'quiz')
) NOT NULL DEFAULT 'interactive';

-- Migrasi data lama: kalau sesi punya poll quiz, mode='quiz'
UPDATE sessions
SET
    mode = 'quiz'
WHERE
    EXISTS (
        SELECT 1
        FROM polls
        WHERE
            polls.session_id = sessions.id
            AND polls.type = 'quiz'
    );

CREATE INDEX IF NOT EXISTS idx_sessions_mode ON sessions (mode);

COMMENT ON COLUMN sessions.mode IS 'interactive = wordcloud/qa/polling tanpa nilai, quiz = quiz dengan nilai';