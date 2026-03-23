import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GradeBatchExams.css";

function GradeBatchExams({ user, onBack }) {
  const [mode, setMode] = useState("multiple");
  const [pagesPerExam, setPagesPerExam] = useState(1);
  const [files, setFiles] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [selectedRubric, setSelectedRubric] = useState("");
  const [generalComments, setGeneralComments] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:8000/rubrics/${user.email}`)
      .then(res => res.json())
      .then(data => setRubrics(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [user?.email]);

  const handleFilesChange = e => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (files.length === 0) {
      alert("You must upload at least one PDF file.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("mode", mode);
    formData.append("rubric_id", selectedRubric);
    formData.append("general_comments", generalComments);
    if (mode === "single") {
      formData.append("pages_per_exam", pagesPerExam);
    }
    if (user?.id) {
      formData.append("user_id", user.id);
    }

    try {
      const resp = await fetch("http://localhost:8000/temp-exams/grade-batch", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Error ${resp.status}: ${errorText}`);
      }
      const data = await resp.json();
      const newExamIds = data.results
        .map(r => r.temp_exam_id || r.exam_id)
        .filter(Boolean);

      if (newExamIds.length > 0) {
        navigate("/view-batch", { state: { examIds: newExamIds } });
      }

      setFiles([]);
      setGeneralComments("");
      setSelectedRubric("");
    } catch (err) {
      alert(`Error grading batch exams: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grade-batch-exams-container">
      {onBack && (
        <button 
          className="grade-batch-exams-back-btn" 
          onClick={onBack}
          type="button"
        >
          ⬅ Back
        </button>
      )}
      <h2>Grade batch exams</h2>
      <form className="grade-batch-exams-form" onSubmit={handleSubmit}>
        <div className="grade-batch-exams-radio-group">
          <label>
            <input
              type="radio"
              value="multiple"
              checked={mode === "multiple"}
              onChange={() => setMode("multiple")}
            />
            Upload multiple PDFs (one exam per file)
          </label>
          <label>
            <input
              type="radio"
              value="single"
              checked={mode === "single"}
              onChange={() => setMode("single")}
            />
            Upload single PDF with all exams
          </label>
        </div>

        {mode === "multiple" && (
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFilesChange}
            required
          />
        )}
        {mode === "single" && (
          <>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFilesChange}
              required
            />
            <label className="pages-per-exam-label">
              Pages per exam:{" "}
              <input
                type="number"
                min={1}
                value={pagesPerExam}
                onChange={e => setPagesPerExam(e.target.value)}
                required={mode === "single"}
              />
            </label>
          </>
        )}

        <label>
          Grading rubric:
          <select
            value={selectedRubric}
            onChange={e => setSelectedRubric(e.target.value)}
          >
            <option value="">Select a rubric</option>
            {rubrics.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.name || r.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          General comments:
          <textarea
            rows={3}
            value={generalComments}
            onChange={e => setGeneralComments(e.target.value)}
            placeholder="General criteria or comments for grading"
          />
        </label>

        <div className="grade-batch-exams-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Grade exams"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GradeBatchExams;
