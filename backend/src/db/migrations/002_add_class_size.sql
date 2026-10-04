ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS class_size INT CHECK (
    class_size IS NULL
    OR class_size > 0
);