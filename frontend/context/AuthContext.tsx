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
  token: string | null;
  isAutheticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAutheticated: boolean;
}

// ============ KONSTANTA ============

const emptyAuthState: AuthState = {
  user: null,
  token: null,
  isAutheticated: false,
};

const authListeners = new Set<() => void>();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ FUNGSI BANTU ============

// Cek apakah token JWT sudah kedaluwarsa
function isTokenExpired(token: string) {
  try {
    // Decode payload JWT (bagian tengah) lalu cek field "exp"
    const jwtPayload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return (
      typeof jwtPayload.exp !== "number" || jwtPayload.exp * 1000 <= Date.now()
    );
  } catch {
    return true;
  }
}

// Ambil state auth terbaru dari localStorage
function getAuthSnapshot() {
  // Saat SSR tidak ada localStorage
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
  const login = (userData: User, tokenData: string) => {
    if (tokenData) localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    Cookies.set("token", tokenData, { expires: 7 });
    Cookies.set("role", userData.role, { expires: 1 });
    notifyAuthListeners();
  };

  // Handler logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token");
    Cookies.remove("role");
    notifyAuthListeners();
  };

  const authContextValue: AuthContextType = {
    user: authState.user,
    token: authState.token,
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