import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ViewBatchExams.css";

function ViewBatchExams({ onExit }) {
  const location = useLocation();
  const navigate = useNavigate();
  const examIds = location.state?.examIds || [];
  const [pending, setPending] = useState(examIds);
  const [currentIndex, setCurrentIndex] = useState(0);

  const examId = pending[currentIndex];

  const [correction, setCorrection] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [assignedGrade, setAssignedGrade] = useState(0);
  const [maxGrade, setMaxGrade] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;

    fetch(`http://localhost:8000/temp-exams/${examId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load temp exam");
        return res.json();
      })
      .then((data) => {
        const corr = Array.isArray(data.correction)
          ? data.correction
          : Array.isArray(data.correction?.correction)
          ? data.correction.correction
          : [];
        setCorrection(corr);
        setStudentName(data.student_name || (corr[0]?.student_name || ""));
        setGeneralComment(data.general_comment || "");
        setAssignedGrade(data.correction?.assigned_grade ?? 0);
        setMaxGrade(data.correction?.max_grade ?? 10);
      })
      .catch(() => {
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

  const handleSaveAndNext = async () => {
    setSaving(true);
    try {
      const putResp = await fetch(`http://localhost:8000/temp-exams/${examId}`, {
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

      const postResp = await fetch(`http://localhost:8000/exams/finalize-correction/${examId}`, {
        method: "POST",
      });

      if (!postResp.ok) {
        const errorText = await postResp.text();
        throw new Error(errorText || "Error finalizing correction");
      }

      alert("Correction saved successfully");

      if (currentIndex + 1 < pending.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        if (onExit) onExit();
        navigate("/my-exams");
      }
    } catch (e) {
      alert("Error saving correction: " + e.message);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!examId) {
    return <p className="view-batch-exams-no-data">Review complete. No more exams to grade.</p>;
  }

  return (
    <div className="view-batch-exams-container">
      <h2 className="view-batch-exams-title">
        View and edit correction ({currentIndex + 1} of {pending.length})
      </h2>

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
            step="0.01"
            min={0}
            max={100}
            value={assignedGrade}
            onChange={(e) => setAssignedGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="view-batch-exams-info-label">Max grade:</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={maxGrade}
            onChange={(e) => setMaxGrade(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="view-batch-exams-info-label">General comment:</span>
          <textarea
            rows={5}
            value={generalComment}
            onChange={(e) => setGeneralComment(e.target.value)}
            placeholder="General comment about the exam"
          />
        </label>
      </div>

      {correction.length === 0 && <p className="view-batch-exams-no-data">No data to display</p>}

      {saving && <p className="view-batch-exams-saving">Saving changes...</p>}

      <div className="view-batch-exams-grades">
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
              Max score: {question["max_score"] ?? "N/A"}
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
        onClick={handleSaveAndNext}
        disabled={saving}
      >
        {saving
          ? "Saving..."
          : currentIndex + 1 === pending.length
          ? "Save and finish"
          : "Save and next exam"}
      </button>
    </div>
  );
}

export default ViewBatchExams;
