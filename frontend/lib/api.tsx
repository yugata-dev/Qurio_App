import { ApiResponse, Poll } from "@/app/dashboard/session/[id]/page";

interface LoginUserSuccess {
  success: true;
  data: {
    user: { id: string; name: string; role: string; email: string };
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
    token: string;
  };
}

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  is_correct: boolean;
  option_order: number;
}

interface Polls {
  success: boolean;
  data: {
    poll: {
      id: string;
      sessionId: number;
      type: "quiz" | "qa" | "wordcloud";
      question: string;
      status: "draft" | "published" | "closed";
      created_at: string;
      published_at: string;
      closed_at: string;
      option?: PollOption[];
    };
  };
}

interface secondPolls {
  success: boolean;
  data: {
    poll: {
      id: string;
      sessionId: number;
      type: "qa" | "wordcloud"
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

interface Sessions {
  id: string;
  success: boolean;
  title: string;
  token: string;
}

interface SessionDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    access_code: number;
    type: "quiz" | "qa" | "wordcloud"
  };
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
          Authorization: `Bearer ${token}`,
        },
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
// id: string;
//     sessionId: number;
//     question: string;
//     status: "draft" | "published" | "closed";
//     created_at: string;
//     published_at: string;
//     closed_at: string;
//     option?: PollOption[];
const secondCreatePolls = async (
  sessionId: string,
  type: "qa" | "wordcloud",
  question: string,
  status: "draft" | "published" | "closed",
  options: PollOptionInput[],
  token: string
): Promise<secondPolls> => {
  try {
    const response = await fetch(
      `${API_URL}/api/sessions/${sessionId}/polls/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, status, options }),
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
  }

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
          Authorization: `Bearer ${token}`,
        },
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
  token: string,
): Promise<Sessions> => {
  try {
    const response = await fetch(`${API_URL}/api/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
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
      headers: { Authorization: `Bearer ${token}` },
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

const getAllDataPolls = async (
  sessionId: string,
  token: string | null,
): Promise<Poll[]> => {
  try {
    const response = await fetch(
      `${API_URL}/api/polls/sessions/${sessionId}/polls`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
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

export {
  fetchUserLogin,
  fetchUserRegister,
  createPolls,
  createSession,
  getDataType,
  postType,
  getDataSession,
  getAllDataPolls,
  secondCreatePolls
};