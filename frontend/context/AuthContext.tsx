"use client";

// ============ IMPORTS ============

// React
import {
  createContext,
  ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";

// Library eksternal
import Cookies from "js-cookie";

// ============ TYPES ============

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAutheticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  isAutheticated: boolean;
}

// ============ KONSTANTA ============

const emptyAuthState: AuthState = {
  user: null,
  isAutheticated: false,
};

const authListeners = new Set<() => void>();
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ FUNGSI BANTU ============

// Token autentikasi berada di cookie HttpOnly dan tidak dibaca oleh JavaScript.
function getAuthSnapshot() {
  // Saat SSR tidak ada localStorage
  if (typeof window === "undefined") {
    return JSON.stringify(emptyAuthState);
  }

  const storedUser = localStorage.getItem("user");
  const storedRole = Cookies.get("role");

  if (!storedUser || !storedRole) {
    return JSON.stringify(emptyAuthState);
  }

  try {
    return JSON.stringify({
      user: storedUser ? JSON.parse(storedUser) : null,
      isAutheticated: true,
    });
  } catch {
    return JSON.stringify(emptyAuthState);
  }
}

function subscribeToAuth(listener: () => void) {
  authListeners.add(listener);
  window.addEventListener("storage", listener);

  // Cleanup saat komponen unmount
  return () => {
    authListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener());
}

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  // Hook: baca state auth dari localStorage dan tetap sinkron saat berubah
  const authState = JSON.parse(
    useSyncExternalStore(
      subscribeToAuth,
      getAuthSnapshot,
      () => JSON.stringify(emptyAuthState),
    ),
  ) as AuthState;

  // Handler login
  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    notifyAuthListeners();
  };

  // Handler logout
  const logout = () => {
    localStorage.removeItem("user");
    Cookies.remove("role");
    void fetch(`${API_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    notifyAuthListeners();
  };

  const authContextValue: AuthContextType = {
    user: authState.user,
    isAutheticated: authState.isAutheticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============ HOOK CUSTOM ============

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (authContext === undefined) {
    throw new Error("useAuth harus digunakan didalam AuthProvider");
  }

  return authContext;
};