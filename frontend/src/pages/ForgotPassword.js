// frontend/src/pages/ForgotPassword.js
import React, { useState, useContext } from "react";
import { AuthContext } from "../AuthContext";

const ForgotPassword = () => {
  const { sendResetLink } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");  
  const [error, setError] = useState("");      

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Enter your email.");
      return;
    }
    const response = await sendResetLink(email);
    if (response.success) {
      setMessage(response.message || "If this email is registered, a password reset link has been sent.");
    } else {
      setError(response.message || "Failed to send reset link. Try later.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Forgot Password</h2>
      <p className="login-subtext">Enter your registered email to receive a reset link</p>

      {error && <div className="error" style={{color:'red'}}>{error}</div>}
      {message && <div className="success" style={{color:'green'}}>{message}</div>}

      <form className="login-form" onSubmit={handleSubmit}>
        <input type="email" className="login-input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="login-btn" type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;