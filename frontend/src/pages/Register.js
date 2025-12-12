// src/pages/Register.js
import React, { useState, useContext } from "react";
import { AuthContext } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { register } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const result = await register(email, password);
    if (result) {
      navigate("/login");
    } else {
      setError("Email already exists. Try logging in.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Create Account</h2>
      <p className="login-subtext">Sign up in seconds</p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form className="login-form" onSubmit={handleRegister}>
        <input type="email" placeholder="Email address" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Create password" className="login-input" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="login-btn">Register</button>
      </form>

      <div className="login-links">Already have an account? <Link to="/login">Login</Link></div>
    </div>
  );
}