"use client"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const fetchUserLogin = async (email: string, password: string, role: string): Promise<loginUser> => {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role, password })
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

export { fetchUserLogin, fetchUserRegister }