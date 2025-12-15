// frontend/src/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import * as api from "./api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.warn("Failed to load auth from storage", e);
    }
  }, []);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    const savedCount = localStorage.getItem("uploadCount");
    if (savedCount) setUploadCount(Number(savedCount));
  }, []);

  const incrementUpload = () => {
    setUploadCount((prev) => {
      const next = prev + 1;
      localStorage.setItem("uploadCount", next);
      return next;
    });
  };

  const isTrialOver = uploadCount >= 3;
  
  // REGISTER - returns boolean to match your components usage
  const register = async (email, password) => {
    try {
      await api.register(email, password);
      return true;
    } catch (err) {
      console.error("Register error:", err);
      return false;
    }
  };

  // LOGIN - returns boolean to match your components usage
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      const tok = res.token;
      setUser({ email });
      setToken(tok);
      localStorage.setItem("user", JSON.stringify({ email }));
      localStorage.setItem("token", tok);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  // SEND RESET LINK - returns object { success, message }
  const sendResetLink = async (email) => {
    try {
      const res = await api.forgotPassword(email);
      return { success: !!res.success, message: res.message || "If registered, you will receive a link." };
    } catch (err) {
      console.error("Send reset link error:", err);
      return { success: false, message: err.message || "Failed to send reset link." };
    }
  };

  // RESET PASSWORD - returns object { success, message }
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await api.resetPassword(token, newPassword);
      return { success: !!res.success, message: res.message || "Password reset" };
    } catch (err) {
      console.error("Reset password error:", err);
      return { success: false, message: err.message || "Failed to reset password." };
    }
  };

  // CHANGE PASSWORD (optional use in profile) - returns object { success, message }
  const changePassword = async (oldPassword, newPassword) => {
    if (!token) return { success: false, message: "Not authenticated" };
    try {
      const res = await api.changePassword(oldPassword, newPassword, token);
      // res could be JSON object or text — normalize
      if (res && res.success !== undefined) return { success: !!res.success, message: res.message || "Password changed" };
      return { success: true, message: "Password changed" };
    } catch (err) {
      console.error("Change password error:", err);
      return { success: false, message: err.message || "Failed to change password." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        register,
        login,
        logout,
        sendResetLink,
        resetPassword,
        changePassword,
        uploadCount,
        incrementUpload,
        isTrialOver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
