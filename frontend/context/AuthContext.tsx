"use client"

import { createContext, ReactNode, useState } from "react"

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

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isAutheticated, setIsAutheticated] = useState<boolean>(false)

    const login = (userData: User, tokenData: string) => {
        setUser(userData)
        setToken(tokenData)
        setIsAutheticated(true)
        if (tokenData)
            localStorage.setItem("token", tokenData)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        setIsAutheticated(false)
        localStorage.removeItem("token")
    }
    const value = {
        user,
        token,
        isAutheticated,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </ AuthContext.Provider>
    )
}

export default AuthContext