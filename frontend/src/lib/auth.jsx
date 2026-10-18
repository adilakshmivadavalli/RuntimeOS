import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatErr } from "@/lib/api";

const AuthCtx = createContext(null);

// The product no longer requires signing in — the backend transparently
// resolves every request to a single shared demo user (see get_current_user
// in backend/server.py). This context just fetches that user once on mount
// so the rest of the app can read `user.name` / `user.role` / `user.email`
// exactly as it did when there was a real login flow.
export function AuthProvider({ children }) {
  // null = checking, false = couldn't reach the server, object = user
  const [user, setUser] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthCtx.Provider value={{ user, refresh, formatErr }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
