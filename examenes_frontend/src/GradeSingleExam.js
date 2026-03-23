import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GradeSingleExam.css";

function GradeSingleExam({ user, onBack }) {
  const [rubrics, setRubrics] = useState([]);
  const [selectedRubric, setSelectedRubric] = useState("");
  const [comments, setComments] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    if (!user?.email) return;
    fetch(`http://localhost:8000/rubrics/${user.email}`)
      .then(res => res.json())
      .then(data => setRubrics(data))
      .catch(err => console.error(err));
  }, [user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("You must upload a PDF");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", pdfFile);
    if (selectedRubric) formData.append("rubric_id", selectedRubric);
    formData.append("comments", comments);
    if (user?.id) formData.append("user_id", user.id);

    try {
      const resp = await fetch("http://localhost:8000/temp-exams/grade-single", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Error ${resp.status}: ${errorText}`);
      }

      const data = await resp.json();
      const tempExamId = data.temp_exam_id;
      navigate(`/view-results/${tempExamId}`, { state: { result: data } });

      setSelectedRubric("");
      setComments("");
      setPdfFile(null);

    } catch (err) {
      alert(`Error submitting exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grade-single-exam-container">
      <h2>Grade single exam</h2>
      <form className="grade-single-exam-form" onSubmit={handleSubmit}>
        <label>
          Rubric:
          <select
            value={selectedRubric}
            onChange={e => setSelectedRubric(e.target.value)}
          >
            <option value="">Choose rubric</option>
            {rubrics.map(r => (
              <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label>
          Comments for auto-grader:
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={2}
          />
        </label>
        <label>
          Exam PDF:
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setPdfFile(e.target.files[0])}
          />
        </label>
        <div className="grade-single-exam-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Grade"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default GradeSingleExam;
