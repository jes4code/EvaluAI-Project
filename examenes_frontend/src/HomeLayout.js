import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logo from "./assets/correccion.png";
import "./HomeLayout.css";

function HomeLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-background">
      <nav className="navbar-centered">
        <div className="navbar-content" style={{ justifyContent: "space-between" }}>
          <div
            className="navbar-logo"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => navigate("/home")}
          >
            <img
              src={logo}
              alt="EvaluIA Logo"
              height={40}
              style={{ marginRight: 10, borderRadius: 6 }}
            />
            <span style={{ color: "#fff", fontWeight: "600", fontSize: "1.25rem" }}>EvaluAI</span>
          </div>
          <div>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/home")}
              style={{ marginRight: 10 }}
            >
              Home
            </button>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/login")}
              style={{ marginRight: 10 }}
            >
              Log in
            </button>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export default HomeLayout;
