// src/components/Navbar.js
import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <header className="top-navbar">
      <div className="top-navbar-inner">

        {/* LEFT SIDE LOGO */}
        <Link to="/" className="nav-logo">
          Cerevyn AI Captioner
        </Link>

        {/* RIGHT SIDE BUTTONS */}
        <div className="nav-right">

          {!user && (
            <button
              className="nav-login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}

          {user && (
            <div className="profile-wrapper" ref={ref}>
              <button
                className="profile-trigger"
                onClick={() => setOpen(!open)}
                aria-label="Profile menu"
              >
                <div className="profile-circle">
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </div>
              </button>

              {open && (
                <div className="profile-dropdown">
                  <button
                    className="dropdown-btn"
                    onClick={() => {
                      navigate("/profile");
                      setOpen(false);
                    }}
                  >
                    View Profile
                  </button>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-btn logout"
                    onClick={() => {
                      logout();
                      setOpen(false);
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}