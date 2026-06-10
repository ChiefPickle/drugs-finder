"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types/auth";
import { loadFavoriteIds, saveFavoriteIds } from "@/lib/favorites";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  favoriteIds: string[];
  setFavoriteIds: (ids: string[]) => void;
  toggleFavorite: (id: string) => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncFavoritesToServer(ids: string[]) {
  await fetch("/api/favorites", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoriteIds: ids }),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIdsState] = useState<string[]>([]);

  const setFavoriteIds = useCallback(
    (ids: string[]) => {
      setFavoriteIdsState(ids);
      saveFavoriteIds(ids);
    },
    []
  );

  const refreshFavorites = useCallback(async () => {
    if (user) {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavoriteIds(data.favoriteIds || []);
      }
    } else {
      setFavoriteIds(loadFavoriteIds());
    }
  }, [user, setFavoriteIds]);

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        setUser(meData.user || null);

        if (meData.user) {
          const favRes = await fetch("/api/favorites");
          if (favRes.ok) {
            const favData = await favRes.json();
            setFavoriteIds(favData.favoriteIds || []);
          }
        } else {
          setFavoriteIds(loadFavoriteIds());
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setFavoriteIds]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const next = favoriteIds.includes(id)
        ? favoriteIds.filter((x) => x !== id)
        : [...favoriteIds, id];
      setFavoriteIds(next);
      if (user) {
        await syncFavoritesToServer(next);
      }
    },
    [favoriteIds, setFavoriteIds, user]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, localFavoriteIds: loadFavoriteIds() }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false as const, error: data.error || "Login failed" };
      setUser(data.user);
      setFavoriteIds(data.favoriteIds || []);
      return { ok: true as const };
    },
    [setFavoriteIds]
  );

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, localFavoriteIds: loadFavoriteIds() }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error || "Registration failed" };
    setUser(data.user);
    setFavoriteIds(data.favoriteIds || loadFavoriteIds());
    return { ok: true as const };
  }, [setFavoriteIds]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setFavoriteIds(loadFavoriteIds());
  }, [setFavoriteIds]);

  const value = useMemo(
    () => ({
      user,
      loading,
      favoriteIds,
      setFavoriteIds,
      toggleFavorite,
      login,
      register,
      logout,
      refreshFavorites,
    }),
    [user, loading, favoriteIds, setFavoriteIds, toggleFavorite, login, register, logout, refreshFavorites]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
