"use client"

import { createContext, ReactNode, useState, useContext, useEffect } from "react"

interface User {
    id: string;
    name: string;
    role: string;
    email: string
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAutheticated: boolean
    login: (user: User, token: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isAutheticated, setIsAutheticated] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")

        if (storedToken) {
            try {
                setToken(storedToken)
                setIsAutheticated(true)

                if (storedUser) {
                    setUser(JSON.parse(storedUser))
                }
            } catch (error) {
                console.error("gagal memuat login:", error)
                localStorage.removeItem("token")
            }
        }

        setIsLoading(false)
    }, [])

    const login = (userData: User, tokenData: string) => {
        setUser(userData)
        setToken(tokenData)
        setIsAutheticated(true)
        if (tokenData)
            localStorage.setItem("token", tokenData)
        localStorage.setItem("user", JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        setIsAutheticated(false)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
    }
    const value = {
        user,
        token,
        isAutheticated,
        login,
        logout
    }

    if (isLoading) {
        return (
            <div style={{ padding: "20px", textRendering: "optimizeLegibility" }}>Sedang memuat...</div>
        )
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </ AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth harus digunakan didalam AuthProvider")
    }

    return context
}