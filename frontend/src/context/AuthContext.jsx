import React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("tm_token");
    setUser(null);
  };

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("tm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (phone, password) => {
    const response = await api.post("/auth/login", {
      phone,
      password
    });

    localStorage.setItem("tm_token", response.data.token);
    setUser(response.data.user);

    return response.data.user;
  };

const register = async (data) => {
  const response = await api.post("/auth/register", data);

  const user = response.data.user;

  // Save token only for active accounts
  if (response.data.token && user.status === "active") {
    localStorage.setItem("tm_token", response.data.token);
    setUser(user);
  }

  return user;
};

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);