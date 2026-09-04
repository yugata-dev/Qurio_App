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
            id: string, sessionId: string, type: "quiz" | "qa" | "wordcloud", question: string,
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

const createPolls = async (type: string, question: string, option: PollOptionInput[], sessionId: string): Promise<Polls> => {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}/polls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, question, option })
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


export { fetchUserLogin, fetchUserRegister, createPolls }