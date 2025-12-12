// src/pages/Login.js
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Cerevyn AI Captioner</h2>
      <p className="login-subtext">Sign in to continue</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form className="login-form" onSubmit={handleLogin}>
        <input type="email" placeholder="Email address" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" className="login-btn">Login</button>
      </form>

      <div className="login-links" style={{ marginTop: 10 }}>
        <Link to="/forgot-password">Forgot Password?</Link> | <Link to="/register">Create Account</Link>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate("/")} className="btn small">Back to Home</button>
      </div>
    </div>
  );
};

export default Login;