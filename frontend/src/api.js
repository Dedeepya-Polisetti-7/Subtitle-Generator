// frontend/src/api.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = data?.detail || data?.message || `HTTP ${res.status}`;
    const error = new Error(err);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}


export const uploadVideo = async (videoFile, language, burn = false, token = null) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("language", language);
  formData.append("burn", burn ? "true" : "false");

  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }
  return res.json();
};

// ---------------- AUTH --------------------

export const register = async (email, password) => {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  return fetch(`${API_BASE}/register`, {
    method: "POST",
    body: form
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message);
    return data;
  });
};

export const login = async (email, password) => {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  return fetch(`${API_BASE}/login`, {
    method: "POST",
    body: form
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message);
    return data; // should contain {token}
  });
};

export const forgotPassword = async (email) => {
  const form = new FormData();
  form.append("email", email);

  return fetch(`${API_BASE}/forgot-password`, {
    method: "POST",
    body: form
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message);
    return data;
  });
};

export const resetPassword = async (token, newPassword) => {
  const form = new FormData();
  form.append("token", token);
  form.append("new_password", newPassword);

  return fetch(`${API_BASE}/reset-password`, {
    method: "POST",
    body: form
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message);
    return data;
  });
};

export const changePassword = async (oldPassword, newPassword, token) => {
  const form = new FormData();
  form.append("old_password", oldPassword);
  form.append("new_password", newPassword);

  return fetch(`${API_BASE}/change-password`, {
    method: "POST",
    body: form,
    headers: { Authorization: `Bearer ${token}` }
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message);
    return data;
  });
};

export default API_BASE;