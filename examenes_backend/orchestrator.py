import os
import io
import tempfile

from fpdf import FPDF
from PyPDF2 import PdfReader, PdfWriter

from examenes_backend.utils.gemini_client import send_image
from examenes_backend.utils.gemini_client import send_pdf_to_gemini


def process_full_pdf(pdf_path, prompt):
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        result = send_pdf_to_gemini(pdf_bytes, prompt, os.path.basename(pdf_path))
        grades = result.get("results") or result.get("grades") or result

        if grades is None:
            raise ValueError("No grades were found in the response")

        return grades
    except Exception as e:
        raise


from fpdf import FPDF

def sanitize_text(value):
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)

    replacements = {
        "\u2019": "'",
        "\u2018": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\u00a0": " ",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    return value.encode("latin-1", "replace").decode("latin-1")


def generate_pdf_report(exam: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_left_margin(10)
    pdf.set_right_margin(10)
    width = 190

    correction_block = exam.get("correction", {})
    if not isinstance(correction_block, dict):
        correction_block = {}

    student_name = correction_block.get("student_name") or exam.get("student_name", "Unknown")
    general_comment = correction_block.get("general_comment") or exam.get("general_comment", "")
    assigned_grade = correction_block.get("assigned_grade", exam.get("assigned_grade", "N/A"))
    max_grade = correction_block.get("max_grade", exam.get("max_grade", "N/A"))
    questions = correction_block.get("correction", [])

    if not isinstance(questions, list):
        questions = []

    pdf.set_font("Arial", size=14)
    pdf.cell(0, 10, txt=sanitize_text(f"Exam Report - {student_name}"), ln=True, align="C")
    pdf.ln(10)

    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, txt=sanitize_text(f"Final Grade: {assigned_grade} / {max_grade}"), ln=True)
    pdf.ln(5)

    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 10, txt=sanitize_text(f"General Comment:\n{general_comment}"))
    pdf.ln(10)

    page_width = pdf.w - pdf.l_margin - pdf.r_margin

    for i, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            continue

        question_number = sanitize_text(question.get("question", str(i)))
        statement = sanitize_text(question.get("statement", ""))
        answer = sanitize_text(question.get("answer", ""))
        assigned_points = question.get("assigned_score", 0)
        max_points = question.get("max_score", 0)
        comments = sanitize_text(question.get("comments", ""))

        pdf.set_font("Arial", style="B", size=12)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(page_width, 8, txt=f"Question {question_number}: {statement}")

        pdf.set_font("Arial", size=11)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(page_width, 8, txt=f"Answer: {answer}")

        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 10, txt=f"Score: {assigned_points} / {max_points}", ln=True)

        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(page_width, 8, txt=f"Comments: {comments}")
        pdf.ln(5)


    result = pdf.output(dest="S")
    return bytes(result) if isinstance(result, bytearray) else result


def split_pdf_into_exams(pdf_bytes, pages_per_exam):
    print("Debug: Starting PDF split")
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    print(f"Debug: Total pages in original PDF: {total_pages}")

    exams = []

    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"Debug: Temporary directory created at: {temp_dir}")

        for i in range(0, total_pages, pages_per_exam):
            print(f"Debug: Processing pages {i} to {min(i + pages_per_exam, total_pages) - 1}")

            writer = PdfWriter()
            for page_num in range(i, min(i + pages_per_exam, total_pages)):
                writer.add_page(reader.pages[page_num])

            output_stream = io.BytesIO()
            writer.write(output_stream)
            split_pdf_bytes = output_stream.getvalue()
            print(f"Debug: Split PDF generated with {len(split_pdf_bytes)} bytes")

            filename = os.path.join(temp_dir, f"subpdf_{i // pages_per_exam + 1}.pdf")
            with open(filename, "wb") as f:
                f.write(split_pdf_bytes)

            print(f"Debug: Split PDF saved to {filename}")
            exams.append(split_pdf_bytes)

        print(f"Debug: Total split PDFs generated: {len(exams)}")
        return exams
