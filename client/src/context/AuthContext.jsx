import { createContext, useMemo, useState } from "react";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/lib/session";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readStoredSession());

  const setAuthSession = (value) => {
    setSession(value);
    writeStoredSession(value);
  };

  const logout = () => {
    setSession(null);
    clearStoredSession();
  };

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      setAuthSession,
      logout,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
