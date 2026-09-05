interface loginUser {
    success: boolean
    data: {
        user: { id: string, name: string, role: string, email: string }
        token: string
    }
}

interface registerUser {
    success: boolean
    data: {
        user: { id: string, name: string, role: string, email: string }
        token: string
    }
}

interface pollOptions {
    id: string
    poll_id: string
    option_text: string
    is_correct: boolean
    option_order: number
}

interface Polls {
    success: boolean
    data: {
        poll: {
            id: string, sessionId: number, type: "quiz" | "qa" | "wordcloud", question: string,
            status: 'draft' | 'published' | 'closed', created_at: string, published_at: string, closed_at: string
            option?: pollOptions[]
        }
    }
}


interface User {
    id: string;
    name: string;
    role: string;
    email: string
}

interface PollOptionInput {
    option_text: string;
    is_correct: boolean;
    option_order: number;
}

interface Sessions {
    id: string
    success: boolean
    title: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const fetchUserLogin = async (email: string, password: string, role: string, token: string): Promise<loginUser> => {

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role, password, token })
        })



        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login Error");
        }

        return await response.json();
    } catch (error) {
        console.error("Login error:", error)
        throw error
    }
}

// DIPERBAIKI: Urutan parameter disamakan -> (name, email, password, role)
const fetchUserRegister = async (name: string, email: string, password: string, role: string): Promise<registerUser> => {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role, password })
        })

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || "Register failed";
            console.error("Backend error detail:", errorData);
            throw new Error(errorMessage);
        }

        // DIPERBAIKI: Cukup gunakan response.json() saja (jangan panggil response.text() sebelumnya)
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
}

const createPolls = async (question: string, option: PollOptionInput[], sessionId: string): Promise<Polls> => {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}/polls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, option })
        })

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || "Created poll failed";
            console.error("Backend error detail:", errorData);
            throw new Error(errorMessage);
        }

        // DIPERBAIKI: Cukup gunakan response.json() saja (jangan panggil response.text() sebelumnya)
        const data = await response.json();
        return data
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
}

const postType = async (type: string, sessionId: string, token: string): Promise<Polls> => {
    if (!sessionId || sessionId === "undefined") {
        throw new Error("Gagal memanggil API: sessionId tidak valid atau bernilai undefined.");
    }

    try {
        const response = await fetch(`${API_URL}polls/sessions/${sessionId}/polls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ type })
        })

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || "Created poll failed";
            console.error("Backend error detail:", errorData);
            throw new Error(errorMessage);
        }

        // DIPERBAIKI: Cukup gunakan response.json() saja (jangan panggil response.text() sebelumnya)
        const data = await response.json();
        return data
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
}

const createSession = async (title: string, token: string): Promise<Sessions> => {
    try {
        const response = await fetch(`${API_URL}/sessions`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        })

        if (!response.ok) {
            const errorData = await response.json()
            const errorMessage = errorData.message || errorData.error || "Created session failed"
            console.error("Backend error detail:", errorData)
            throw new Error(errorMessage)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error("Create sessions:", error)
        throw error
    }
}

const getDataSession = async (title: string, sessionId: number): Promise<Sessions> => {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
            method: "GET",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title, sessionId })
        })

        if (!response.ok) {
            const errorData = await response.json()
            const errorMessage = errorData.message || errorData.error() || "Created sessions failed"
            console.error("Backend error detail:", errorData)
            throw new Error(errorMessage)
        }

        return await response.json()

    } catch (error) {
        console.error("Create sessions:", error)
        throw error
    }
}


export { fetchUserLogin, fetchUserRegister, createPolls, createSession, getDataSession, postType }