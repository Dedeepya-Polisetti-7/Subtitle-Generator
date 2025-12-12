// src/pages/Profile.js
import React, { useContext } from "react";
import { AuthContext } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h2>Profile</h2>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Subscription Plan:</strong> {user?.plan}</p>
      <p><strong>Uploads used:</strong> {user?.uploadCount || 0} / 3 (free trial)</p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          className="btn"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Logout & Back to Home
        </button>

        {/* Reset Password - uses the same forgot-password flow (sends reset email) */}
        <button
          className="btn"
          onClick={() => navigate("/forgot-password")}
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}