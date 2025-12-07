import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Dummy register logic
    localStorage.setItem("token", "dummy_token");
    navigate("/dashboard");
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Register</h1>
      </div>
      <div className="content">
        <form onSubmit={handleRegister}>
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
            Register
          </button>
        </form>
        <div>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;