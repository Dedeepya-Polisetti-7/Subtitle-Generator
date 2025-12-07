import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
import VideoUploader from "./pages/VideoUploader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<VideoUploader />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;