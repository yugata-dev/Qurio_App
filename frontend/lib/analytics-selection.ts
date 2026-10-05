export interface QualifiedStudentScore<TName = string> {
  studentName: TName;
  average: number;
  sessionCount: number;
}

/** Shared qualification and ordering for the top score leaderboard. */
export function selectQualifiedTopStudents<T extends QualifiedStudentScore>(
  students: T[],
  minimumSessions: number,
): T[] {
  return students
    .filter((student) => student.sessionCount >= minimumSessions)
    .sort((first, second) =>
      second.average - first.average ||
      second.sessionCount - first.sessionCount ||
      String(first.studentName).localeCompare(String(second.studentName), "id"),
    );
}
