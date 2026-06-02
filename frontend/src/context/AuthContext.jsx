import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // start true — we verify token first

  // On app load: verify token and refresh user from server (never trust stale localStorage)
  useEffect(() => {
    const token = localStorage.getItem("saarthi_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => {
        const freshUser = data.user;
        // Normalise all IDs to strings
        freshUser._id = freshUser._id?.toString();
        freshUser.linkedElderlyId = freshUser.linkedElderlyId
          ? freshUser.linkedElderlyId.toString()
          : null;
        localStorage.setItem("saarthi_user", JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Token invalid — clear everything
        localStorage.removeItem("saarthi_token");
        localStorage.removeItem("saarthi_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (phone, password) => {
    try {
      const { data } = await api.post("/auth/login", { phone, password });
      const u = data.user;
      u._id = u._id?.toString();
      u.linkedElderlyId = u.linkedElderlyId ? u.linkedElderlyId.toString() : null;
      localStorage.setItem("saarthi_token", data.token);
      localStorage.setItem("saarthi_user", JSON.stringify(u));
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.post("/auth/register", formData);
      const u = data.user;
      u._id = u._id?.toString();
      u.linkedElderlyId = u.linkedElderlyId ? u.linkedElderlyId.toString() : null;
      localStorage.setItem("saarthi_token", data.token);
      localStorage.setItem("saarthi_user", JSON.stringify(u));
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("saarthi_token");
    localStorage.removeItem("saarthi_user");
    setUser(null);
  };

  // Show nothing while verifying token on first load
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};