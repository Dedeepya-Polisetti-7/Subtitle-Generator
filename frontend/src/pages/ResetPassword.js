// frontend/src/pages/ResetPassword.js
import React, { useState, useContext, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

const ResetPassword = () => {
  const { resetPassword } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No reset token provided.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await resetPassword(token, newPassword);
    if (res.success) {
      setMessage(res.message || "Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(res.message || "Failed to reset password.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Reset Password</h2>
      <p className="login-subtext">Set a new password for your account</p>

      {error && <div style={{color:'red'}}>{error}</div>}
      {message && <div style={{color:'green'}}>{message}</div>}

      <form className="login-form" onSubmit={handleSubmit}>
        <input type="password" className="login-input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input type="password" className="login-input" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="login-btn" type="submit">Set new password</button>
      </form>
    </div>
  );
};

export default ResetPassword;