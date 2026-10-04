import {
  Poll,
  SessionData,
} from "@/app/(workspace)/dashboard/session/[id]/page";

interface LoginUserSuccess {
  success: true;
  data: {
    user: {
      id: string;
      name: string;
      role: string;
      email: string;
    };
    token: string;
  };
}

interface LoginUserFailed {
  success: false;
  message: string;
}

type LoginUserResult = LoginUserSuccess | LoginUserFailed;

interface RegisterUserResult {
  success: boolean;
  data: {
    user: { id: string; name: string; role: string; email: string };
  };
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

export interface Polls {
  success: boolean;
  data: {
    poll: {
      id: string;
      sessionId: number;
      type: "quiz" | "polling" | "qa" | "wordcloud";
      question: string;
      status: "draft" | "published" | "closed";
      created_at: string;
      published_at: string;
      closed_at: string;
      option?: PollOption[];
    };
  };
}

interface PollOptionInput {
  text: string;
  is_correct: boolean;
  option_order: number;
}

export interface Sessions {
  id: string;
  success: boolean;
  title: string;
  code_access: number;
  name: string;
  absen: number;
  token: string;
}

export interface SessionListItem {
  id: string;
  teacher_id: string;
  title: string;
  access_code: string;
  class_size: number | null;
  mode: "interactive" | "quiz";
  participant_count: number;
  status: "active" | "ended";
  created_at: string;
  ended_at: string | null;
}

interface SessionListResponse {
  success: boolean;
  data: SessionListItem[];
}

interface SessionDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    access_code: number;
    class_size: number | null;
    mode: "interactive" | "quiz";
    type: "quiz" | "polling" | "qa" | "wordcloud";
    status: "active" | "ended";
  };
}

interface JoinSessionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    session_id: string;
    name: string;
    absen: number;
  };
}

export interface responseQuestions {
  success: boolean;
  data: {
    poll_id: string;
    participant_id: string;
    answer: string;
    option_id: string;
  };
}

export interface PollingDistributionItem {
  optionId: string;
  optionText: string;
  votes: number;
  percentage: number;
}

export type PollStats =
  | {
    pollId: string;
    pollType: "polling";
    totalVotes: number;
    distribution: PollingDistributionItem[];
  }
  | {
    pollId: string;
    pollType: "quiz";
    correct_count: number;
    incorrect_count: number;
    total_count: number;
  };

export interface responseAnswer {
  success: boolean;
  data: PollStats;
}

export type AnalyticsPeriod = "7d" | "30d" | "all";

/** Satu baris breakdown kehadiran per sesi dari endpoint analytics summary. */
export interface AttendanceBreakdownItem {
  sessionId: string;
  title: string;
  classSize: number;
  joined: number;
  rate: number;
}

export interface AnalyticsSummary {
  totalStudents: number;
  averageScore: number;
  participationRate: number;
  attendanceRate: number;
  totalSessions: number;
  sessionsWithClassSize: number;
  attendanceBreakdown: AttendanceBreakdownItem[];
}

export interface StudentScore {
  studentKey: string;
  studentName: string;
  sessionId: string;
  sessionTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface StudentParticipation {
  studentKey: string;
  studentName: string;
  sessionsJoined: number;
  questionsAsked: number;
  responsesSubmitted: number;
}

export interface TopTopic {
  questionId: string;
  questionText: string;
  sessionTitle: string;
  incorrectRate: number;
  totalAnswers: number;
}

export interface ScoreBySessionPoint {
  sessionId: string;
  sessionTitle: string;
  createdAt: string;
  avgScore: number;
  totalAnswers: number;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

const fetchUserLogin = async (
  email: string,
  password: string,
): Promise<LoginUserResult> => {
  try {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Login Error");
    }

    return await response.json();
  } catch (error) {
    console.error("Gagal login:", error);
    throw error;
  }
};

const fetchUserRegister = async (
  name: string,
  email: string,
  password: string,
  role: string,
): Promise<RegisterUserResult> => {
  try {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Register failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gagal register:", error);
    throw error;
  }
};

const createPolls = async (
  type: string,
  question: string,
  options: PollOptionInput[],
  sessionId: string,
  token: string,
  status: "draft" | "published" | "closed",
): Promise<Polls> => {
  try {
    const response = await fetch(
      `${API_URL}/api/polls/sessions/${sessionId}/polls`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ type, question, options, status }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Created poll failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gagal membuat poll:", error);
    throw error;
  }
};

const postType = async (
  type: string,
  sessionId: string,
  token: string,
): Promise<Polls> => {
  if (!sessionId || sessionId === "undefined") {
    throw new Error(
      "Gagal memanggil API: sessionId tidak valid atau bernilai undefined.",
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/polls/sessions/${sessionId}/polls`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ type }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Created poll failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gagal mengirim tipe poll:", error);
    throw error;
  }
};

const createSession = async (
  title: string,
  classSize: number | null,
  mode: "interactive" | "quiz",
  token?: string,
): Promise<Sessions> => {
  const normalizedClassSize =
    classSize === undefined || classSize === null
      ? null
      : Number(classSize);

  try {
    const response = await fetch(`${API_URL}/api/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title,
        class_size: normalizedClassSize,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Created session failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Gagal membuat sesi:", error);
    throw error;
  }
};

export const getSessionList = async (): Promise<SessionListItem[]> => {
  const response = await fetch(`${API_URL}/api/sessions`, {
    method: "GET",
    credentials: "include",
  });

  const result = (await response.json()) as SessionListResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok || !result.success) {
    throw new Error(result.message || result.error || "Sesi gagal dimuat");
  }

  return result.data;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
    method: "DELETE",
    credentials: "include",
  });

  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    error?: string;
  };

  if (!response.ok || !result.success) {
    throw new Error(result.message || result.error || "Gagal menghapus sesi");
  }
};

const getDataType = async (sessionId: string): Promise<Sessions> => {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}/type`, {
      method: "GET",
      headers: { "content-type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Created sessions failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Gagal mengambil tipe data:", error);
    throw error;
  }
};

const getDataSession = async (
  sessionId: string,
  token: string | null,
): Promise<SessionDetailResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Get data failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Gagal mengambil data sesi:", error);
    throw error;
  }
};

export interface PublicSession {
  id: string;
  title: string;
  access_code: number;
  status: "active" | "ended";
}

export const getPublicSession = async (
  sessionId: string,
): Promise<PublicSession> => {
  const response = await fetch(`${API_URL}/api/sessions/${sessionId}/public`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Sesi tidak ditemukan.");
  }

  const result = (await response.json()) as { data: PublicSession };
  return result.data;
};

const getAllDataPolls = async (
  sessionId: string,
  token: string | null,
): Promise<Poll[]> => {
  try {
    const response = await fetch(
      `${API_URL}/api/polls/sessions/${sessionId}/polls`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || errorData.error || "Get data failed";
      console.error("Detail error backend:", errorData);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error("Gagal mengambil data poll:", error);
    throw error;
  }
};

export const updateSinglePolls = async (
  pollId: string,
  status: "published" | "closed",
  token: string | null,
): Promise<Poll> => {
  try {
    const response = await fetch(`${API_URL}/api/polls/${pollId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Gagal mengupdate status poll");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Gagal mengupdate status:", error);
    throw error;
  }
};

export const updateStatusSession = async (
  sessionId: string,
  status: "active" | "ended",
  token: string | null,
): Promise<SessionData> => {
  try {
    const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        `Gagal memperbarui status sesi (HTTP ${response.status})`,
      );
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Gagal mengupdate status:", error);
    throw error;
  }
};

export const fetchUserParticipant = async (
  access_code: number,
  name: string,
  absen: number,
  participant_id: string | null,
): Promise<JoinSessionResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/sessions/participants/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_code, nama: name, absen, participant_id }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Gagal memasuki sesi!`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gagal mengupdate status:", error);
    throw error;
  }
};

export const fetchCurrentPoll = async (sessionId: string): Promise<Poll> => {
  try {
    const response = await fetch(
      `${API_URL}/api/polls/sessions/${sessionId}/current`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Gagal mendapatkan soal!`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Gagal mendapat soal:", error);
    throw error;
  }
};

export const fetchResponsePoll = async (
  pollId: string | null | undefined,
  participant_id: string | null,
  answer: string,
  option_id: string | null | undefined,
): Promise<responseQuestions> => {
  try {
    const response = await fetch(
      `${API_URL}/api/responses/${pollId}/responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participant_id, answer, option_id }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Respon gagal`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Respon gagal dikirim:", error);
    throw error;
  }
};

export const fetchQuestionPoll = async (
  pollId: string,
  participantId: string,
  questionText: string,
) => {
  const response = await fetch(`${API_URL}/api/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      poll_id: pollId,
      participant_id: participantId,
      question_text: questionText,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || "Pertanyaan gagal dikirim. Silakan coba lagi.",
    );
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
};

export const fetchWordcloudPoll = async (
  pollId: string,
  participantId: string,
  word: string,
) => {
  const response = await fetch(`${API_URL}/api/wordcloud/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      poll_id: pollId,
      participant_id: participantId,
      word,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal kirim wordcloud");
  }

  return response.json();
};

export const fetchQuestionList = async (pollId: string) => {
  const response = await fetch(
    `${API_URL}/api/questions?poll_id=${encodeURIComponent(pollId)}`,
    {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal mengambil daftar pertanyaan");
  }

  return response.json();
};

export const fetchWordcloudList = async (pollId: string) => {
  const response = await fetch(
    `${API_URL}/api/wordcloud/${encodeURIComponent(pollId)}/responses`,
    {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal mengambil data wordcloud");
  }

  return response.json();
};

export const fetchResponseGetPoll = async (
  pollId: string,
): Promise<responseAnswer> => {
  try {
    const response = await fetch(
      `${API_URL}/api/responses/${pollId}/responses`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Respon gagal`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Respon gagal dikirim:", error);
    throw error;
  }
};

function getAnalyticsHeaders(token?: string): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  let authToken = token;

  if (!authToken && typeof window !== "undefined") {
    try {
      authToken = window.localStorage.getItem("token") ?? undefined;
    } catch {
      authToken = undefined;
    }
  }

  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
  return headers;
}

async function fetchAnalyticsData<T>(
  path: string,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}/api/analytics/${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: getAnalyticsHeaders(token),
  });

  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    message?: string;
    error?: string;
  };

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(
      result.message || result.error || "Data analytics gagal dimuat.",
    );
  }

  return result.data;
}

export const getAnalyticsSummary = (
  period: AnalyticsPeriod = "7d",
  token?: string,
): Promise<AnalyticsSummary> =>
  fetchAnalyticsData<AnalyticsSummary>(
    `summary?period=${encodeURIComponent(period)}`,
    token,
  );

export const getAnalyticsScores = (
  period: AnalyticsPeriod = "7d",
  token?: string,
): Promise<StudentScore[]> =>
  fetchAnalyticsData<StudentScore[]>(
    `scores?period=${encodeURIComponent(period)}`,
    token,
  );

export const getAnalyticsStudents = (
  period: AnalyticsPeriod = "7d",
  token?: string,
): Promise<StudentParticipation[]> =>
  fetchAnalyticsData<StudentParticipation[]>(
    `students?period=${encodeURIComponent(period)}`,
    token,
  );

export const getAnalyticsTopics = (
  period: AnalyticsPeriod = "7d",
  limit = 5,
  token?: string,
): Promise<TopTopic[]> =>
  fetchAnalyticsData<TopTopic[]>(
    `topics?period=${encodeURIComponent(period)}&limit=${encodeURIComponent(String(limit))}`,
    token,
  );

export const getAnalyticsScoreBySession = (
  token?: string,
): Promise<ScoreBySessionPoint[]> =>
  fetchAnalyticsData<ScoreBySessionPoint[]>("score-by-session", token);

export {
  fetchUserLogin,
  fetchUserRegister,
  createPolls,
  createSession,
  getDataType,
  postType,
  getDataSession,
  getAllDataPolls,
};
