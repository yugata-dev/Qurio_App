-- 1. TABLE USERS (guru & peserta)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL UNIQUE,
    PASSWORD VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('guru', 'siswa')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLE SESSIONS (ruang kelas/acara)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    access_code VARCHAR(6) NOT NULL UNIQUE,
    STATUS VARCHAR(20) DEFAULT 'active' CHECK (STATUS IN ('active', 'ended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- 3. TABLE POLLS (pertanyaan/interaksi)
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    TYPE VARCHAR(20) NOT NULL CHECK (TYPE IN ('wordcloud', 'polling', 'qa', 'quiz')),
    question TEXT NOT NULL,
    STATUS VARCHAR(20) DEFAULT 'draft' CHECK (STATUS IN ('draft', 'published', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- 4. TABLE POLL_OPTIONS (opsi untuk polling & quiz)
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT NOT NULL
);

-- 5. TABLE RESPONSES (jawaban peserta)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participant_name VARCHAR(100),
    answer TEXT,
    option_id UUID REFERENCES poll_options(id) ON DELETE
    SET
        NULL,
        is_correct BOOLEAN,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLE QUESTIONS (Q&A kelas)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    answered BOOLEAN DEFAULT FALSE,
    answer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP
);

-- 7. TABLE QUESTION_VOTES (mencegah upvote ganda siswa pada pertanyaan yang sama)
CREATE TABLE IF NOT EXISTS question_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (question_id, student_id)
);

-- Cegah siswa yang login mengisi jawaban lebih dari sekali pada poll yang sama
CREATE UNIQUE INDEX IF NOT EXISTS unique_response_per_student ON responses (poll_id, student_id)
WHERE
    student_id IS NOT NULL;

-- Percepat pencarian data berdasarkan poll
CREATE INDEX IF NOT EXISTS idx_responses_poll ON responses (poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options (poll_id);

CREATE INDEX IF NOT EXISTS idx_questions_session ON questions (session_id);

CREATE INDEX IF NOT EXISTS idx_question_votes_question ON question_votes (question_id);