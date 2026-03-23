import React from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";

function TeacherDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate("/login", { replace: true });
  };

  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <h2>Welcome, {user?.name || user?.email || "Teacher"}</h2>
        <button onClick={handleLogout} className="logout-btn">
          Log out
        </button>
      </header>

      <main className="teacher-menu">
        <div className="menu-card" onClick={() => navigate("/my-exams")}>
          📄
          <h3>My exams</h3>
          <p>View and manage your existing exams.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/my-rubrics")}>
          📑
          <h3>My rubrics</h3>
          <p>Manage criteria and rubrics for grading.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/create-rubric")}>
          ➕
          <h3>Create rubric</h3>
          <p>Define criteria, descriptions, and points for grading.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/grade-exam")}>
          📝
          <h3>Grade exam</h3>
          <p>Upload and grade an individual exam.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/grade-batch")}>
          📦
          <h3>Grade batch</h3>
          <p>Grade multiple exams at once.</p>
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;
