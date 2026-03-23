import React, { useState } from "react";
import "./CreateRubric.css";

function CreateRubric({ user, onBack }) {
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", criteria: [{ description: "", points: "" }] }
  ]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleQuestionTextChange = (questionIndex, value) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, text: value }
          : q
      )
    );
  };

  const handleCriterionChange = (questionIndex, criterionIndex, field, value) => {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const newCriteria = q.criteria.map((c, j) =>
          j === criterionIndex ? { ...c, [field]: value } : c
        );
        return { ...q, criteria: newCriteria };
      })
    );
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { text: "", criteria: [{ description: "", points: "" }] }]);
  };

  const deleteQuestion = (questionIndex) => {
    setQuestions(prev => prev.filter((_, i) => i !== questionIndex));
  };

  const addCriterion = (questionIndex) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, criteria: [...q.criteria, { description: "", points: "" }] }
          : q
      )
    );
  };

  const deleteCriterion = (questionIndex, criterionIndex) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, criteria: q.criteria.filter((_, j) => j !== criterionIndex) }
          : q
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const resp = await fetch("http://localhost:8000/rubrics/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: user.email,
          name,
          questions,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Error creating rubric");
      }

      await resp.json();
      setMessage("Rubric created successfully ✅");
      setName("");
      setQuestions([{ text: "", criteria: [{ description: "", points: "" }] }]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="create-rubric-container">
      <h2>Create rubric</h2>
      {message && <p className="create-rubric-message">{message}</p>}
      {error && <p className="create-rubric-error">{error}</p>}

      <form onSubmit={handleSubmit} className="create-rubric-form">
        <div className="create-rubric-name">
          <label>Rubric name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="question-block">
            <div className="question-header">
              <label>{`Question ${questionIndex + 1}`}</label>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="delete-question-btn"
                  onClick={() => deleteQuestion(questionIndex)}
                  title="Delete question"
                >
                  ❌
                </button>
              )}
            </div>
            <textarea
              className="question-text"
              value={question.text}
              onChange={(e) => handleQuestionTextChange(questionIndex, e.target.value)}
              required
              placeholder="Enter main question statement"
              rows={2}
              style={{ marginBottom: "18px", width: "100%" }}
            />
            <table className="criteria-table">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th>Points</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {question.criteria.map((criterion, criterionIndex) => (
                  <tr key={criterionIndex}>
                    <td>
                      <textarea
                        value={criterion.description}
                        onChange={e => handleCriterionChange(questionIndex, criterionIndex, "description", e.target.value)}
                        required
                        placeholder="Detailed criterion"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={criterion.points}
                        onChange={e => handleCriterionChange(questionIndex, criterionIndex, "points", e.target.value)}
                        required
                        placeholder="Points"
                      />
                    </td>
                    <td>
                      {question.criteria.length > 1 && (
                        <button
                          type="button"
                          className="delete-criterion-btn"
                          onClick={() => deleteCriterion(questionIndex, criterionIndex)}
                          title="Delete criterion"
                        >
                          ❌
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="add-criterion-btn"
              onClick={() => addCriterion(questionIndex)}
            >
              + Add criterion
            </button>
          </div>
        ))}

        <button
          type="button"
          className="add-question-btn"
          onClick={addQuestion}
        >
          + Add question
        </button>
        <button
          type="submit"
          className="save-rubric-btn"
        >
          Save rubric
        </button>
      </form>
    </div>
  );
}

export default CreateRubric;
