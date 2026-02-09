import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import api from "../api/axios";
import {
  clearAuthStorage,
  splashStorage,
  tokenStorage,
  userStorage,
  refreshTokenStorage,
} from "./storage";
import { logError } from "../utils/logger";

export interface User {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string;
  level: number;
  points: number;
  streak?: number;
  longestStreak?: number;
  joinDate: string;
  lastLoginDate?: string;
  status?: "ACTIVE" | "INACTIVE" | "BANNED";
  vocabularyProgress?: number;
  kanjiProgress?: number;
  grammarProgress?: number;
  exerciseProgress?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSeenSplash: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  markSplashAsSeen: () => void;
  onNavigate?: (page: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (backendUser: any): User => ({
  id: backendUser.id,
  username: backendUser.username || "",
  fullName: backendUser.fullName,
  email: backendUser.email,
  role: (backendUser.role || "USER").toUpperCase() as "USER" | "ADMIN",
  avatarUrl: backendUser.avatarUrl || "",
  level: backendUser.level || 1,
  points: backendUser.points || 0,
  streak: backendUser.streak || 0,
  longestStreak: backendUser.longestStreak || 0,
  joinDate: backendUser.joinDate || new Date().toISOString(),
  lastLoginDate: backendUser.lastLoginDate,
  status: backendUser.status,
  vocabularyProgress: backendUser.vocabularyProgress || 0,
  kanjiProgress: backendUser.kanjiProgress || 0,
  grammarProgress: backendUser.grammarProgress || 0,
  exerciseProgress: backendUser.exerciseProgress || 0,
});

export const AuthProvider = ({
  children,
  onNavigate,
}: {
  children: ReactNode;
  onNavigate?: (page: string) => void;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(splashStorage.get());

  const loadUserFromBackend = async () => {
    const token = tokenStorage.get();
    if (!token) return;

    try {
      const res = await api.get("/user/me");
      const backendUser = res.data?.data ?? res.data;

      if (!backendUser) throw new Error("No user data");

      const normalized = normalizeUser(backendUser);
      setUser(normalized);
      userStorage.set(normalized);
    } catch (error) {
      logError("Load user failed:", error);
      setUser(null);
      clearAuthStorage();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      setHasSeenSplash(splashStorage.get());

      const token = tokenStorage.get();
      if (token) {
        await loadUserFromBackend();
      } else {
        const savedUser = userStorage.get();
        if (savedUser) {
          setUser(savedUser as User);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post(
        "/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;
      if (!data?.token) return false;

      tokenStorage.set(data.token);
      if (data.refreshToken) {
        refreshTokenStorage.set(data.refreshToken);
      }

      await loadUserFromBackend();
      return true;
    } catch (error) {
      logError("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setHasSeenSplash(false);
    clearAuthStorage();
    onNavigate?.("landing");
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    userStorage.set(updated);
  };

  const refreshUser = async () => {
    await loadUserFromBackend();
  };

  const markSplashAsSeen = () => {
    setHasSeenSplash(true);
    splashStorage.set(true);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      hasSeenSplash,
      login,
      logout,
      updateUser,
      refreshUser,
      markSplashAsSeen,
      onNavigate,
    }),
    [user, loading, hasSeenSplash, onNavigate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
