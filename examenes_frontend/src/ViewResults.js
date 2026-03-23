import React, { useState, useEffect, useRef } from "react";
import { useLocation, Navigate, useParams, useNavigate } from "react-router-dom";
import "./ViewBatchExams.css";

function ViewResults() {
  const location = useLocation();
  const { tempExamId } = useParams();
  const navigate = useNavigate();

  const result = location.state?.result || null;

  const [correction, setCorrection] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [assignedGrade, setAssignedGrade] = useState(0);
  const [maxGrade, setMaxGrade] = useState(0);
  const [saving, setSaving] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!tempExamId) return;
    fetch(`http://localhost:8000/temp-exams/${tempExamId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load temp exam");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.correction)) {
          setCorrection(data.correction);
        } else if (Array.isArray(data.correction?.correction)) {
          setCorrection(data.correction.correction);
        } else {
          setCorrection([]);
        }

        setStudentName(data.student_name || (data.correction?.[0]?.student_name || ""));
        setGeneralComment(data.general_comment || "");
        setAssignedGrade(data.correction?.assigned_grade ?? 0);
        setMaxGrade(data.correction?.max_grade ?? 10);
      })
      .catch((e) => {
        console.error(e);
        setCorrection([]);
        setStudentName("");
        setGeneralComment("");
        setAssignedGrade(0);
        setMaxGrade(0);
      });
  }, [tempExamId]);

  if (!result) {
    return <Navigate to="/grade-exam" replace />;
  }

  const handleChange = (index, field, value) => {
    setCorrection((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const putResp = await fetch(`http://localhost:8000/temp-exams/${tempExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correction,
          student_name: studentName,
          general_comment: generalComment,
          assigned_grade: assignedGrade,
          max_grade: maxGrade,
        }),
      });

      if (!putResp.ok) {
        const errorText = await putResp.text();
        throw new Error(errorText || "Error updating temp exam");
      }

      const postResp = await fetch(`http://localhost:8000/exams/finalize-correction/${tempExamId}`, {
        method: "POST",
      });

      if (!postResp.ok) {
        const errorText = await postResp.text();
        throw new Error(errorText || "Error finalizing correction");
      }

      alert("Correction saved successfully");
      navigate("/my-exams");
    } catch (e) {
      alert("Error saving correction: " + e.message);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="view-batch-exams-container">
      <h2 className="view-batch-exams-title">View and edit correction</h2>

      <div className="view-batch-exams-info">
        <label>
          <span className="view-batch-exams-info-label">Student:</span>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student name"
          />
        </label>

        <label>
          <span className="view-batch-exams-info-label">Assigned grade:</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={maxGrade}
            value={assignedGrade}
            onChange={(e) => setAssignedGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="view-batch-exams-info-label">Max grade:</span>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={maxGrade}
            onChange={(e) => setMaxGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="view-batch-exams-info-label">General comment:</span>
          <textarea
            rows={4}
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            placeholder="General comment about the exam"
          />
        </label>
      </div>

      <div className="view-batch-exams-grades">
        {correction.length === 0 && <p>No data to display</p>}
        {correction.map((question, idx) => (
          <div className="view-batch-exams-grade" key={idx}>
            <label>
              <strong>Statement:</strong>
              <textarea
                rows={3}
                value={question.statement || ""}
                onChange={(e) => handleChange(idx, "statement", e.target.value)}
              />
            </label>

            <label>
              <strong>Answer:</strong>
              <textarea
                rows={3}
                value={question.answer || ""}
                onChange={(e) => handleChange(idx, "answer", e.target.value)}
              />
            </label>

            <label>
              <strong>Comments:</strong>
              <textarea
                rows={3}
                value={question.comments || ""}
                onChange={(e) => handleChange(idx, "comments", e.target.value)}
              />
            </label>

            <label>
              Max score:&nbsp;
              {question["max_score"] ?? "N/A"}
            </label>

            <label>
              Assigned score:&nbsp;
              <input
                type="number"
                step="0.25"
                min={0}
                max={question["max_score"] ?? 10}
                value={question["assigned_score"] ?? 0}
                onChange={(e) =>
                  handleChange(
                    idx,
                    "assigned_score",
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                style={{ width: 60 }}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        className="view-batch-exams-save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save correction"}
      </button>
    </div>
  );
}

export default ViewResults;
