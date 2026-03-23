import React from "react";

function LoadingOverlay() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      color: "white",
      fontSize: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      userSelect: "none",
      pointerEvents: "auto",
    }}>
      Processing correction, please wait...
    </div>
  );
}

export default LoadingOverlay;
