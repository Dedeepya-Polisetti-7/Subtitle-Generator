const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const uploadVideo = async (videoFile, language, burn = false) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("language", language);
  formData.append("burn", burn ? "true" : "false");

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  return response.json();
};

export default API_BASE;