import React from "react";
import { NavLink, Link } from "react-router-dom";
import logoImg from "./assets/correccion.png";
import "./Navbar.css";

function Navbar({ onLogout }) {
  return (
    <nav className="navbar-pill">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/teacher-dashboard" className="navbar-logo-link" aria-label="Home">
            <img src={logoImg} alt="EvaluIA Logo" className="navbar-logo" />
          </Link>
          <span className="navbar-brand-name">EvaluIA</span>
        </div>

        <div className="navbar-actions">
          <NavLink to="/my-exams" className="navbar-pill-btn">My exams</NavLink>
          <NavLink to="/my-rubrics" className="navbar-pill-btn">My rubrics</NavLink>
          <NavLink to="/create-rubric" className="navbar-pill-btn">Create rubric</NavLink>
          <NavLink to="/grade-exam" className="navbar-pill-btn">Grade single exam</NavLink>
          <NavLink to="/grade-batch" className="navbar-pill-btn">Grade batch exams</NavLink>
          <button className="navbar-pill-btn btn-navbar-logout" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
