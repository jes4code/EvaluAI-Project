from typing import Dict
from examenes_backend.database import db
from bson import ObjectId
import os
from fastapi import UploadFile
from examenes_backend.orchestrator import process_full_pdf, split_pdf_into_exams

collection = db["temp_exams"]

def insert_temp_exam(json_data):
    result = collection.insert_one(json_data)
    return str(result.inserted_id)

def get_temp_exam(temp_exam_id: str):
    try:
        obj_id = ObjectId(temp_exam_id)
    except Exception:
        return None
    return collection.find_one({"_id": obj_id})

def delete_temp_exam(temp_exam_id):
    return collection.delete_one({"temp_exam_id": temp_exam_id})

def update_temp_exam(temp_exam_id_str: str, updated_data: dict) -> None:
    try:
        exam_id = ObjectId(temp_exam_id_str)
    except Exception:
        raise ValueError("Invalid ID")

    current_exam = db["temp_exams"].find_one({"_id": exam_id})
    if not current_exam:
        raise ValueError("Temporary exam not found")

    correction_obj = current_exam.get("correction", {})
    current_metadata = correction_obj.get("metadata", {})

    updated_correction = {
        "metadata": current_metadata,
        "correction": updated_data.get("correction", correction_obj.get("correction", [])),
        "student_name": updated_data.get("student_name", correction_obj.get("student_name", "")),
        "general_comment": updated_data.get("general_comment", correction_obj.get("general_comment", "")),
        "assigned_grade": updated_data.get("assigned_grade", correction_obj.get("assigned_grade", 0)),
        "max_grade": updated_data.get("max_grade", correction_obj.get("max_grade", 0)),
    }

    root_changes = {}
    for field in ["student_name", "general_comment", "status"]:
        if field in updated_data:
            root_changes[field] = updated_data[field]

    changes = {"correction": updated_correction}
    changes.update(root_changes)

    db["temp_exams"].update_one(
        {"_id": exam_id},
        {"$set": changes}
    )

async def grade_exam(
    pdf: UploadFile,
    rubric_id: str = None,
    comments: str = "",
    user_id: str = None,
) -> dict:
    try:
        criteria_text = ""
        criteria_json = []

        if rubric_id:
            from examenes_backend.repo.rubric_repo import get_rubric_by_id
            rubric = get_rubric_by_id(rubric_id)
            if not rubric:
                raise Exception("Rubric not found")

            criteria_text_list = []
            questions = rubric.get("questions", [])
            for question in questions:
                question_text = question.get("text", "")
                criteria_text_list.append(f"Question: {question_text}")

                criteria = question.get("criteria", [])
                for criterion in criteria:
                    description = criterion.get("description", "")
                    points = criterion.get("points", "")
                    criteria_text_list.append(f"- {description} ({points} points)")

            criteria_text = "\n".join(criteria_text_list)

        os.makedirs("temp", exist_ok=True)
        temp_path = os.path.join("temp", pdf.filename)
        with open(temp_path, "wb") as f:
            f.write(await pdf.read())

        prompt = "Grade the exam according to the instructions and rubric (if provided).\n\n"
        if criteria_text:
            prompt += f"Use the following rubric:\n{criteria_text}\n\n"
        prompt += f"Additional teacher instructions:\n{comments}\n\n"
        prompt += (
            'If a question has no student answer, explicitly indicate it in the "answer" field with the value "No answer", '
            'add a clarifying comment, and assign a score of 0.\n\n'
            'If you detect a block of code or a complex mathematical expression in the student answer, it is not necessary to transcribe it literally. '
            "Instead, provide a brief and clear summary of the function or purpose of that code or expression.\n\n"
            'If the exam content or the student answers are written in Spanish, translate them into natural academic English in the output.\n'
            'Specifically, the fields "statement", "answer", "comments", and "general_comment" must always be written in English, even if the original exam is in Spanish.\n'
            'Preserve the original meaning faithfully and do not omit relevant technical details.\n'
            'Do not keep the transcription in Spanish unless a technical term, identifier, or code element must remain unchanged.\n\n'
            "Output format:\n"
            "Return EXCLUSIVELY a JSON object with this structure:\n"
            "{\n"
            '  "correction": [\n'
            "    {\n"
            '      "question": "question number or name",\n'
            '      "statement": "literal text",\n'
            '      "answer": "detected answer or \'No answer\'",\n'
            '      "max_score": maximum score for the question,\n'
            '      "assigned_score": the score you assign to the student answer,\n'
            '      "comments": "correction made to the student exercise and what they need to improve to obtain the maximum score for that exercise"\n'
            "    }\n"
            "  ],\n"
            '  "student_name": "name of the student who took the exam; if not detected leave blank; format: LastName1 LastName2, FirstName",\n'
            '  "general_comment": "General analysis summarizing performance, strengths, areas for improvement, and recommendations."\n'
            "}\n"
            "All numeric values must be unquoted numbers.\n"
            "Do not include anything outside that JSON."
        )



        result = process_full_pdf(temp_path, prompt)
        os.remove(temp_path)

        temp_exam = {
            "file_name": pdf.filename,
            "user_id": user_id,
            "rubric_id": rubric_id,
            "criteria": criteria_json,
            "extra_comments": comments,
            "correction": result,
            "student_name": result.get("student_name"),
            "general_comment": result.get("general_comment"),
            "status": "pending_review",
        }

        temp_exam_id = insert_temp_exam(temp_exam)

        return {
            "message": "Correction generated and saved temporarily",
            "temp_exam_id": temp_exam_id,
            "file_name": pdf.filename,
            "user_id": user_id,
            "rubric_id": rubric_id,
            "criteria": criteria_json,
            "extra_comments": comments,
            "student_name": result.get("student_name"),
            "general_comment": result.get("general_comment"),
            "correction": result
        }
    except Exception as e:
        raise e
