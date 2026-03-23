import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyExams.css";

function MyExams({ user, onBack }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    const fetchExams = async () => {
      try {
        const resp = await fetch(`http://localhost:8000/exams/all_my_exams/${user.id}`);
        if (!resp.ok) {
          throw new Error(`Error loading exams: ${resp.statusText}`);
        }
        const data = await resp.json();
        setExams(data.exams || []);
      } catch (err) {
        console.error("Error loading exams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [user?.id]);

  if (loading) return <p>Loading exams...</p>;

  if (exams.length === 0)
    return (
      <div className="my-exams-container">
        {onBack && (
          <button onClick={onBack} className="back-btn">
            ⬅ Back
          </button>
        )}
        <p>You have no stored exams.</p>
      </div>
    );

  const getStatusText = (status) =>
    status === "success" ? "Corrected" : "Pending review";

  const handleViewEdit = (exam) => {
    if (exam.status === "success") {
      navigate(`/edit-correction/${exam._id}`);
    } else if (exam.status === "pending_review") {
      navigate(`/view-results/${exam._id}`, { state: { result: exam } });
    } else {
      alert("Cannot navigate: unknown status or type");
    }
  };

  return (
    <div className="my-exams-container">
      <div className="my-exams-header">
        <h2>My Exams</h2>
        {onBack && (
          <button onClick={onBack} className="back-btn" aria-label="Back">
            ⬅ Back
          </button>
        )}
      </div>

      <table className="my-exams-table">
        <thead>
          <tr>
            <th>File name</th>
            <th>Student</th>
            <th>Grade</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam) => {
            const grade = exam.correction?.assigned_grade ?? exam.assigned_grade ?? exam.grade ?? "-";
            const fileName = exam.file_name || exam.name || "Untitled";
            const studentName = exam.student_name || exam.correction?.student_name || "-";
            return (
              <tr
                key={exam._id}
                className={exam.status === "success" ? "corrected" : "pending"}
                onClick={() => handleViewEdit(exam)}
              >
                <td>{fileName}</td>
                <td>{studentName}</td>
                <td>{grade}</td>
                <td>
                  {exam.correction?.metadata?.timestamp
                    ? new Date(exam.correction.metadata.timestamp.replace(" ", "T")).toLocaleDateString()
                    : "-"}
                </td>
                <td>{getStatusText(exam.status)}</td>
                <td>
                  {exam.status === "success" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`http://localhost:8000/exams/download-report/${exam._id}`, "_blank");
                      }}
                      className="download-btn"
                    >
                      Download report
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MyExams;
