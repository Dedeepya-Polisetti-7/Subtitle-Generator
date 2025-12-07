import React, { useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a video!");

    const form = new FormData();
    form.append("file", file);
    form.append("language", language);

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8000/generate-subtitle-video",
        form,
        { responseType: "blob" }
      );

      const url = URL.createObjectURL(new Blob([res.data]));
      setVideoUrl(url);
    } catch (err) {
      alert("Error processing video");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Cerevyn Subtitle Generator</h1>
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="content">
        <div className="upload-section">
          <label className="upload-area">
            <div className="upload-icon">📁</div>
            <p>Click to upload video</p>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </label>

          <select
            className="language-select"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
            <option value="ta">Tamil</option>
          </select>

          <button className="btn" onClick={handleUpload}>
            Generate Subtitled Video
          </button>

          {loading && (
            <div className="loading active">
              <div className="spinner"></div>
              <p>Processing video...</p>
            </div>
          )}

          {videoUrl && (
            <div className="video-preview">
              <video src={videoUrl} controls></video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}