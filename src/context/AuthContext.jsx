"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authService, setToken, getToken } from "@/services/api";
import { levelFor, POLICY } from "@/lib/config";

const AuthContext = createContext(null);
const ONBOARD_KEY = "mpscpulse.onboarded";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await authService.me();
      setUser(data.user);
      return data.user;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the session restore does not setState inside the effect body.
    Promise.resolve().then(refresh);
  }, [refresh]);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Step 1 — the server validates the profile and emails a verification code.
   * No session is created until `verifyOtp` succeeds.
   */
  const register = useCallback(async (payload) => authService.register(payload), []);

  /** Step 2 — the code creates the account and returns the usual JWT session. */
  const verifyOtp = useCallback(async (payload) => {
    const data = await authService.verifyOtp(payload);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const resendOtp = useCallback(async (payload) => authService.resendOtp(payload), []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const acceptPolicy = useCallback(async (payload) => {
    const data = await authService.acceptPolicy(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const needsPolicyAcceptance = useMemo(() => {
    if (!user) return false;
    return (
      user.termsVersion !== POLICY.termsVersion ||
      user.privacyVersion !== POLICY.privacyVersion
    );
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "ADMIN",
      level: levelFor(user?.xp || 0),
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      refresh,
      acceptPolicy,
      updateUser,
      needsPolicyAcceptance,
    }),
    [
      user,
      loading,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      refresh,
      acceptPolicy,
      updateUser,
      needsPolicyAcceptance,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasOnboarded() {
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}
