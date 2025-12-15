// src/pages/VideoUploader.js
import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../api";
import API_BASE from "../api";
import { AuthContext } from "../AuthContext";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

const VideoUploader = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [language, setLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subtitles, setSubtitles] = useState([]);
  const [srtFilename, setSrtFilename] = useState("");
  const [burnedFilename, setBurnedFilename] = useState("");
  const [burn, setBurn] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const { user, uploadCount, incrementUpload, isTrialOver, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // language list (display names)
  const LANGUAGES = [
    "English","Hindi","French","Spanish","German","Portuguese","Chinese","Japanese",
    "Korean","Russian","Arabic","Italian","Dutch","Polish","Turkish","Vietnamese","Thai",
  ];

  const validateFile = (file) => {
    if (!file) { setError("Please select a video file."); return false; }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload a video file (MP4, MOV, AVI, MPEG, WebM).");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 500MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB.`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) { setVideoFile(file); setError(""); }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && validateFile(file)) { setVideoFile(file); setError(""); }
  };

  const handleUpload = async () => {
    if (!videoFile) { setError("Please select a video file."); return; }
    if (typeof incrementUpload === "function") {
      incrementUpload();
    }
    if (isTrialOver) {
      alert("Your free trial of 3 video uploads has ended. Please subscribe to continue.");
      navigate("/#plans");
      return;
    }

    setLoading(true); setError(""); setSuccess("");

    try {
      const response = await uploadVideo(videoFile, language.toLowerCase(), burn);

      if (response && response.subtitles && Array.isArray(response.subtitles)) {
        setSubtitles(response.subtitles);
        setSuccess("Subtitles generated successfully!");
        if (response.srt_file) setSrtFilename(response.srt_file);
        if (response.burned_video) setBurnedFilename(response.burned_video);
        if (response.burn_error) setError(`Burn error: ${response.burn_error}`);

        incrementUpload();
      } else {
        setError("Unexpected response format from server.");
      }
    } catch (err) {
      setError(err?.message || "Failed to process video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputClick = () => fileInputRef.current?.click();
  const safeUploadCount = Number.isFinite(uploadCount) ? uploadCount : 0;
  const remainingUploads = Math.max(0, 3 - safeUploadCount);

  return (
    <div className="container">
      
      <div className="content">
        {/* free-trial banner */}
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.15)", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 500 }}>
            {isTrialOver ? "Your free trial has ended. Subscribe to continue using Cerevyn AI Captioner." : `Free trial: ${remainingUploads} of 3 video uploads remaining.`}
          </div>
          <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }} onClick={() => navigate("/#plans")}>Subscribe Now</button>
        </div>

        {error && <div className="error active" role="alert">{error}</div>}
        {success && <div className="success active" role="status">{success}</div>}

        <label htmlFor="video-upload" className={`upload-area ${dragOver ? "dragover" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} role="button" tabIndex="0" aria-label="Upload video file by clicking or dragging" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleFileInputClick(); } }}>
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {videoFile ? (
              <>
                <strong>{videoFile.name}</strong><br />
                <small>({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</small>
              </>
            ) : "Upload Video by Click or drag video here"}
          </div>
          <input ref={fileInputRef} type="file" id="video-upload" accept="video/*" onChange={handleFileChange} aria-label="Select video file" />
        </label>

        <div className="controls">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ flex: "1", minWidth: 180 }}>
              <label htmlFor="target-lang-select" style={{ display: "block", marginBottom: 4, fontSize: "0.9em", fontWeight: 500 }}>Subtitle Language</label>
              <select id="target-lang-select" className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Select subtitle language">
                {LANGUAGES.map((lang) => <option key={lang} value={lang.toLowerCase()}>{lang}</option>)}
              </select>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <input type="checkbox" checked={burn} onChange={(e) => setBurn(e.target.checked)} />
            <span style={{ fontSize: "0.95em" }}>Burn subtitles into video</span>
          </label>

          <button className="btn" onClick={handleUpload} disabled={loading || !videoFile} aria-busy={loading} aria-label={loading ? "Processing video..." : "Generate Subtitles"}>{loading ? "Processing..." : "Generate Subtitles"}</button>
        </div>

        {subtitles.length > 0 && (
          <div className="subtitle-display" role="region" aria-label="Generated subtitles">
            {subtitles.map((item, idx) => (
              <div key={idx} className="subtitle-item">
                <div className="subtitle-time">{item.time}</div>
                <div className="subtitle-text">{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {srtFilename && (
          <div className="download-section">
            <a className="btn" href={`${API_BASE}/download/srt/${encodeURIComponent(srtFilename)}`} target="_blank" rel="noreferrer" download>Download .srt</a>
          </div>
        )}

        {burnedFilename && (
          <div className="download-section">
            <a className="btn" href={`${API_BASE}/download/output/${encodeURIComponent(burnedFilename)}`} target="_blank" rel="noreferrer">Download video with burned subtitles</a>
            <div style={{ marginTop: 12 }}>
              <video src={`${API_BASE}/download/output/${encodeURIComponent(burnedFilename)}`} controls style={{ maxWidth: "100%" }} />
            </div>
          </div>
        )}

        {loading && (
          <div className="loading active">
            <div className="spinner" aria-label="Loading" />
            <p>Processing your video...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
