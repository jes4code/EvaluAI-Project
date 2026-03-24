import React, { useState, useEffect, useRef } from "react";
import { useLocation, Navigate, useParams, useNavigate } from "react-router-dom";
import "./EditCorrection.css";


function EditCorrection() {
  const location = useLocation();
  const { examId } = useParams();
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
    if (!examId) return;
    fetch(`http://localhost:8000/exams/${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load final correction");
        return res.json();
      })
      .then((data) => {
        const corr = Array.isArray(data.correction)
          ? data.correction
          : data.correction?.correction || [];
        setCorrection(corr);
        setStudentName(data.student_name || (data.correction?.[0]?.student_name || ""));
        setGeneralComment(data.general_comment || "");
        setAssignedGrade(data.correction.assigned_grade ?? 0);
        setMaxGrade(data.correction.max_grade ?? 10);
      })
      .catch((e) => {
        console.error(e);
        setCorrection([]);
        setStudentName("");
        setGeneralComment("");
        setAssignedGrade(0);
        setMaxGrade(0);
      });
  }, [examId]);

  const handleChange = (index, field, value) => {
    setCorrection((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`http://localhost:8000/exams/${examId}`, {
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
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Unknown error saving correction");
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
    <div className="edit-correction-container">
      <h2 className="edit-correction-title">View and edit correction</h2>

      <div className="edit-correction-info">
        <label>
          <span className="edit-correction-info-label">Student:</span>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Student name"
          />
        </label>

        <label>
          <span className="edit-correction-info-label">Assigned grade:</span>
          <input
            type="number"
            step="0.1"
            value={assignedGrade}
            min={0}
            max={maxGrade}
            onChange={(e) => setAssignedGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="edit-correction-info-label">Max grade:</span>
          <input
            type="number"
            step="0.1"
            value={maxGrade}
            min={0}
            max={100}
            onChange={(e) => setMaxGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="edit-correction-info-label">General comment:</span>
          <textarea
            rows={4}
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            placeholder="General comment about the exam"
          />
        </label>
      </div>

      <div className="edit-correction-grades">
        {correction.length === 0 && <p className="edit-correction-no-data">No data to display</p>}

        {saving && <p className="edit-correction-saving">Saving changes...</p>}

        {correction.map((question, idx) => (
          <div className="edit-correction-grade" key={idx}>
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
        className="edit-correction-save-btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save correction"}
      </button>
    </div>
  );
}

export default EditCorrection;