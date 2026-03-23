import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import GradeSingleExam from "./GradeSingleExam";
import ViewResults from "./ViewResults";
import ViewBatchExams from "./ViewBatchExams";
import GradeBatchExams from "./GradeBatchExams";
import CreateRubric from "./CreateRubric";
import TeacherDashboard from "./TeacherDashboard";
import MyExams from "./MyExams";
import MyRubrics from "./MyRubrics";
import EditCorrection from "./EditCorrection";
import LayoutWithNavbar from "./LayoutWithNavbar";
import HomeLayout from "./HomeLayout";

export const UserContext = createContext(null);

function PrivateRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route element={<HomeLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route
            path="/teacher-dashboard"
            element={
              <PrivateRoute user={user}>
                <TeacherDashboard user={user} onLogout={() => setUser(null)} />
              </PrivateRoute>
            }
          />

          <Route element={<LayoutWithNavbar user={user} onLogout={() => setUser(null)} />}>
            <Route
              path="/grade-exam"
              element={
                <PrivateRoute user={user}>
                  <GradeSingleExam user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/view-results/:tempExamId"
              element={
                <PrivateRoute user={user}>
                  <ViewResults user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/view-batch"
              element={
                <PrivateRoute user={user}>
                  <ViewBatchExams user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/grade-batch"
              element={
                <PrivateRoute user={user}>
                  <GradeBatchExams user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-correction/:examId"
              element={
                <PrivateRoute user={user}>
                  <EditCorrection user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-rubric"
              element={
                <PrivateRoute user={user}>
                  <CreateRubric user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-exams"
              element={
                <PrivateRoute user={user}>
                  <MyExams user={user} />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-rubrics"
              element={
                <PrivateRoute user={user}>
                  <MyRubrics user={user} />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
