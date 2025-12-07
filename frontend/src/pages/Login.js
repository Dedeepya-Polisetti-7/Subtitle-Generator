import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simple dummy auth logic
    if (email === "test@example.com" && password === "123456") {
      localStorage.setItem("token", "dummy_token");
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Login</h1>
      </div>
      <div className="content">
        {error && <div className="error active">{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn" type="submit">
            Login
          </button>
        </form>
        <div>
          <Link to="/forgot-password">Forgot Password?</Link> |{" "}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;