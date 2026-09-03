import React, { createContext, useContext } from "react";
import { authApi } from "../api/authApi";
import { useLocalStorage } from "../hooks/useLocalStorage";

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [session, setSession] = useLocalStorage("authUser", null);

  // Both throw on failure (e.g. wrong password, email already registered) —
  // calling pages catch and show the message themselves.
  const login = async (email, password) => {
    const { user, token } = await authApi.login({ email, password });
    setSession({ user, token });
  };

  const register = async (name, email, password) => {
    const { user, token } = await authApi.register({ name, email, password });
    setSession({ user, token });
  };

  const logout = () => setSession(null);

  const value = {
    user: session?.user || null,
    isAuthenticated: Boolean(session?.user),
    isAdmin: session?.user?.role === "admin",
    login,
    register,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
