import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function LayoutWithNavbar({ user, onLogout }) {
  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <main style={{ padding: "20px 24px", minHeight: "calc(100vh - 64px)" }}>
        <Outlet />
      </main>
    </>
  );
}

export default LayoutWithNavbar;
