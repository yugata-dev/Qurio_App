"use client"

import { useState, useEffect } from "react"

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

const fetchUserLogin = async (email: string, password: string, role: string): Promise<loginUser> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, role, password })
        })

        if (!response.ok) throw new Error("Login Error")

        const data = await response.json()
        return data
    } catch (error) {
        console.error("Login error:", error)
        throw error
    }
}

const fetchUserRegister = async (email: string, name: string, password: string, role: string): Promise<registerUser> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, role, password })
        })

        if (!response.ok) {
            const errorData = await response.json()  // ← ambil error dari backend
            console.error("Backend error:", errorData)
            throw new Error(errorData.error || "Register failed")
        }
        console.log("Status:", response.status)  // ← lihat status code
        console.log("Status Text:", response.statusText)

        const text = await response.text()  // ← ambil raw text dulu
        console.log("Raw Response:", text)
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Login error:", error)
        throw error
    }
}


export { fetchUserLogin, fetchUserRegister }