import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail || "Invalid username or password");
        setLoading(false);
        return;
      }
      const data = await resp.json();
      onLogin(data.user);

      if (data.user.role === "teacher") {
        navigate("/teacher-dashboard", { replace: true });
      } else if (data.user.role === "student") {
        navigate("/student-dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError("Server connection error");
    }
    setLoading(false);
  };

  return (
    <main className="main-content">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        <div className="inputs">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Connecting..." : "Sign in"}
        </button>
        <p className="register-text">
          Not registered yet?{" "}
          <span onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </form>
    </main>
  );
}

export default Login;
