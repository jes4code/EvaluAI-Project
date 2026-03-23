import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyRubrics.css";

function MyRubrics({ user, onBack }) {
  const navigate = useNavigate();

  const [rubrics, setRubrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rubricToDelete, setRubricToDelete] = useState(null);
  const [editingRubric, setEditingRubric] = useState(null);
  const [editRubric, setEditRubric] = useState(null);

  const loadRubrics = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/rubrics/${user.email}`);
      if (!resp.ok) throw new Error("Error loading rubrics");
      const data = await resp.json();
      setRubrics(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRubrics();
  }, [user?.email]);

  const deleteRubric = async (id) => {
    try {
      const resp = await fetch(`http://localhost:8000/rubrics/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Could not delete rubric");
      setRubrics(rubrics.filter(r => r._id !== id));
      setRubricToDelete(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditRubric = (rubric) => {
    setEditRubric({
      ...rubric,
      questions: rubric.questions.map(q => ({
        ...q,
        criteria: q.criteria.map(c => ({ ...c }))
      }))
    });
    setEditingRubric(rubric);
  };

  const handleEditChange = (field, value) => {
    setEditRubric(edit => ({ ...edit, [field]: value }));
  };

  const handleCriterionEdit = (questionIndex, criterionIndex, field, value) => {
    setEditRubric(edit => ({
      ...edit,
      questions: edit.questions.map((q, qIndex) => {
        if (qIndex !== questionIndex) return q;
        return {
          ...q,
          criteria: q.criteria.map((criterion, cIndex) =>
            cIndex === criterionIndex ? { ...criterion, [field]: value } : criterion
          )
        };
      }),
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/rubrics/${editRubric._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editRubric.name,
          questions: editRubric.questions,
        })
      });
      if (!resp.ok) throw new Error("Error updating rubric");
      setRubrics(rubrics.map(r => r._id === editRubric._id ? editRubric : r));
      setEditingRubric(null);
      setEditRubric(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="my-rubrics-container">
      <div className="rubrics-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Rubrics</h2>
        <button
          className="rubrics-btn rubrics-create"
          onClick={() => navigate('/create-rubric')}
          style={{ padding: '6px 12px', fontSize: '1rem', cursor: 'pointer' }}
        >
          + New rubric
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="rubrics-error">{error}</p>
      ) : rubrics.length === 0 ? (
        <p>You have no rubrics created.</p>
      ) : (
        <table className="rubrics-table">
          <thead>
            <tr>
              <th>Name</th>
              <th># Criteria</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rubrics.map(r => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.questions?.reduce((sum, q) => sum + (q.criteria?.length || 0), 0)}</td>
                <td>
                  <button
                    className="rubrics-btn rubrics-edit"
                    onClick={() => openEditRubric(r)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="rubrics-btn rubrics-delete"
                    onClick={() => setRubricToDelete(r)}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rubricToDelete && (
        <div className="rubrics-modal-overlay">
          <div className="rubrics-modal">
            <h4>Delete rubric?</h4>
            <p>
              Are you sure you want to delete the rubric <b>{rubricToDelete.name}</b>?
              This action cannot be undone.
            </p>
            <div className="rubrics-modal-actions">
              <button
                className="rubrics-btn rubrics-delete"
                onClick={() => deleteRubric(rubricToDelete._id)}
              >
                Yes, delete
              </button>
              <button
                className="rubrics-btn rubrics-cancel"
                onClick={() => setRubricToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingRubric && editRubric && (
        <div className="rubrics-modal-overlay">
          <div className="rubrics-modal edit-rubric-modal">
            <h4>Edit rubric</h4>
            <label>
              Name:
              <input
                className="rubrics-edit-input"
                type="text"
                value={editRubric.name}
                onChange={e => handleEditChange("name", e.target.value)}
              />
            </label>
            {editRubric.questions.map((question, questionIndex) => (
              <div className="criteria-edit-list" key={questionIndex}>
                <h5 className="criteria-edit-question-title">{`Question ${questionIndex + 1}`}</h5>
                {question.criteria.map((criterion, index) => (
                  <div className="criterion-edit-row" key={index}>
                    <textarea
                      className="criterion-edit-description"
                      value={criterion.description}
                      onChange={e => handleCriterionEdit(questionIndex, index, "description", e.target.value)}
                      placeholder="Criterion text"
                      rows={2}
                      style={{
                        width: '100%',
                        minWidth: '220px',
                        maxWidth: '520px',
                        padding: '8px 12px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        marginBottom: '4px'
                      }}
                    />
                    <input
                      className="criterion-edit-points"
                      type="number"
                      min={0}
                      value={criterion.points}
                      onChange={e => handleCriterionEdit(questionIndex, index, "points", parseInt(e.target.value) || 0)}
                      placeholder="Points"
                      style={{
                        width: '70px',
                        padding: '8px 6px',
                        fontSize: '1rem',
                        marginLeft: '10px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
            <div className="rubrics-modal-actions">
              <button
                className="rubrics-btn rubrics-edit"
                onClick={handleSaveEdit}
              >
                Save changes
              </button>
              <button
                className="rubrics-btn rubrics-cancel"
                onClick={() => { setEditingRubric(null); setEditRubric(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRubrics;
