"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const emptyAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authListeners = new Set<() => void>();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function getAuthSnapshot() {
  if (typeof window === "undefined") {
    return JSON.stringify(emptyAuthState);
  }

  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!storedToken || isTokenExpired(storedToken)) {
    return JSON.stringify(emptyAuthState);
  }

  try {
    return JSON.stringify({
      user: storedUser ? JSON.parse(storedUser) : null,
      token: storedToken,
      isAuthenticated: true,
    });
  } catch {
    return JSON.stringify(emptyAuthState);
  }
}

function subscribeToAuth(listener: () => void) {
  authListeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    authListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = JSON.parse(
    useSyncExternalStore(
      subscribeToAuth,
      getAuthSnapshot,
      () => JSON.stringify(emptyAuthState),
    ),
  ) as AuthState;

  const login = (userData: User, tokenData: string) => {
    if (tokenData) localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    Cookies.set("token", tokenData, { expires: 7 });
    Cookies.set("role", userData.role, { expires: 1 });
    notifyAuthListeners();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token");
    Cookies.remove("role");
    notifyAuthListeners();
  };

  const value: AuthContextType = {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan didalam AuthProvider");
  }

  return context;
};