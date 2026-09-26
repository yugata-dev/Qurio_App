"use client";

// ============ IMPORTS ============

// React
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// ============ TYPES ============

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ============ KONSTANTA ============

const emptyAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
};


const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/api\/?$/, "");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============ PROVIDER ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(emptyAuthState);

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_URL}/api/users/me`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Unauthenticated");
        return response.json() as Promise<{ data: { user: User } }>;
      })
      .then((response) => {
        if (isMounted) {
          setAuthState({ user: response.data.user, isAuthenticated: true });
        }
      })
      .catch(() => {
        if (isMounted) setAuthState(emptyAuthState);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler login
  const login = (userData: User) => {
    setAuthState({ user: userData, isAuthenticated: true });
  };

  // Handler logout
  const logout = () => {
    void fetch(`${API_URL}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    setAuthState(emptyAuthState);
  };


  const authContextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
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
