import React, { useContext } from "react";
import { AuthContext } from "../AuthContext";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <>
      <div className="dashboard-navbar">
        <h2 className="dashboard-title">Profile</h2>

        <div className="dashboard-profile">
          <span className="dash-email">{user?.email}</span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        <h3>Welcome, {user?.email}</h3>
        <p>
          This is your profile area. You can manage your account and view usage
          here (coming soon).
        </p>
      </div>
    </>
  );
}