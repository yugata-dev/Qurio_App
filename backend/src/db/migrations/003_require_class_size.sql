-- Set default 30 untuk sesi lama yang belum punya class_size.
UPDATE sessions SET class_size = 30 WHERE class_size IS NULL;

-- Ubah kolom jadi NOT NULL.
ALTER TABLE sessions ALTER COLUMN class_size SET NOT NULL;

-- Pastikan CHECK constraint ada.
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_class_size_check;

ALTER TABLE sessions
ADD CONSTRAINT sessions_class_size_check CHECK (class_size BETWEEN 1 AND 500);