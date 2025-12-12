// src/pages/Home.js
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "../index.css";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleStartClick = () => {
    if (user) navigate("/dashboard");
    else navigate("/register");
  };

  const scrollToPlans = () => {
    const el = document.getElementById("plans-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-wrapper">
      <div className="home-content">
        {/* HERO */}
        <section className="home-hero">
          <h1 className="home-hero-title">Cerevyn AI Captioner</h1>
          <h2>AI-Powered Subtitle Generator for Effortless Captioning</h2>
          <p className="home-hero-subtitle">
            Cerevyn AI Captioner turns your videos into perfectly timed
            subtitles. Improve accessibility, reach global audiences, and save
            hours of manual work.
          </p>

          <div className="home-hero-actions">
            <button className="primary-btn" onClick={handleStartClick}>
              {user ? "Go to Video Uploader" : "Get Started"}
            </button>
            <button className="secondary-btn" onClick={scrollToPlans}>
              View Subscription Plans
            </button>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="home-benefits">
          <h2>Why creators love Cerevyn</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <h3>Fast & Accurate</h3>
              <p>Powered by advanced AI models like Whisper for high-quality speech recognition and clean subtitles.</p>
            </div>
            <div className="benefit-card">
              <h3>Multi-Language Support</h3>
              <p>Generate subtitles in multiple languages and make your content accessible worldwide.</p>
            </div>
            <div className="benefit-card">
              <h3>Burned or Downloadable</h3>
              <p>Download SRT files or export videos with burned-in subtitles ready to upload anywhere.</p>
            </div>
            <div className="benefit-card">
              <h3>Clean & Simple UI</h3>
              <p>Minimal, distraction-free interface so you can focus on your content, not on complex tools.</p>
            </div>
          </div>
        </section>

        {/* SUBSCRIPTION PLANS */}
        <section className="home-plans" id="plans-section">
          <h2>Subscription Plans</h2>
          <p className="plans-subtitle">Start with a free trial of up to 3 video uploads. Upgrade anytime to unlock unlimited usage.</p>

          <div className="plans-grid">
            <div className="plan-card">
              <h3>Monthly</h3>
              <p className="plan-price">Contact Admin for more details</p>
              <ul className="plan-features">
                <li>Unlimited video uploads</li>
                <li>Priority processing</li>
                <li>Download SRT & burned videos</li>
              </ul>
              <button className="primary-btn" onClick={handleStartClick}>Subscribe Monthly</button>
            </div>

            <div className="plan-card plan-card-highlight">
              <h3>Yearly</h3>
              <p className="plan-price">Contact Admin for more details</p>
              <p className="plan-tag">Best Value</p>
              <ul className="plan-features">
                <li>Unlimited video uploads</li>
                <li>Priority support</li>
                <li>Ideal for regular creators</li>
              </ul>
              <button className="primary-btn" onClick={handleStartClick}>Subscribe Yearly</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
