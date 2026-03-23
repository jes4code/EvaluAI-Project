import React from "react";
import "./Home.css";
import imgScan from "./assets/escaneo.png";
import imgCorrection from "./assets/correccion.png";
import imgReports from "./assets/informes.png";

function Home() {
  return (
    <main className="main-content">
      <div className="home-hero">
        <div className="home-texts">
          <h1>
            AI for grading exams <span className="highlight">accurately and quickly</span>
          </h1>
          <p className="subtitle">
            Upload your handwritten, digital, or mixed exams.<br />
            Our LLM grades them, scores them, and reports performance automatically.
          </p>
        </div>
        <div className="feature-cards">
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgScan} alt="Scan" width="80" height="80" />
            </div>
            <h3>Scan any exam</h3>
            <p>Upload PDFs of any exam, including handwritten ones.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgCorrection} alt="Correction" width="80" height="80" />
            </div>
            <h3>Smart grading</h3>
            <p>Apply your own rubric criteria so our LLM evaluates according to your instructions, justifying each answer.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgReports} alt="Reports" width="80" height="80" />
            </div>
            <h3>Get student progress reports</h3>
            <p>Download personalized reports on your students' exam evaluations.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
