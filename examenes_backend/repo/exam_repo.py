from examenes_backend.database import db
from bson import ObjectId

collection = db["corrections"]

def save_exam_correction(temp_exam_id_str: str) -> str:
    try:
        temp_exam_id = ObjectId(temp_exam_id_str)
    except Exception:
        raise ValueError("Invalid ID")

    temp_exam = db["temp_exams"].find_one({"_id": temp_exam_id})
    if not temp_exam:
        raise ValueError("Temporary exam not found")

    temp_exam["status"] = "success"

    result = db["corrections"].insert_one(temp_exam)

    db["temp_exams"].delete_one({"_id": temp_exam_id})

    return str(result.inserted_id)

def insert_exam(json_data):
    result = collection.insert_one(json_data)
    return str(result.inserted_id)

def get_exam(exam_id: str):
    try:
        obj_id = ObjectId(exam_id)
    except Exception:
        return None

    exam = collection.find_one({"_id": obj_id})
    if exam:
        exam["_id"] = str(exam["_id"])
    return exam

def get_all_user_exams(user_id: str):
    temp_exams = list(db["temp_exams"].find({"user_id": user_id}))
    corrections = list(db["corrections"].find({"user_id": user_id}))

    for exam in temp_exams:
        exam["type"] = "temporary"

    for exam in corrections:
        exam["type"] = "final"

    all_exams = temp_exams + corrections

    for exam in all_exams:
        exam["_id"] = str(exam["_id"])

    return all_exams

def update_exam(exam_id_str: str, updated_data: dict) -> dict:
    try:
        exam_id = ObjectId(exam_id_str)
    except Exception:
        raise ValueError("Invalid ID")

    current_exam = db["corrections"].find_one({"_id": exam_id})
    if not current_exam:
        raise ValueError("Exam not found")

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

    result = db["corrections"].find_one_and_update(
        {"_id": exam_id},
        {"$set": changes},
        return_document=True
    )

    if not result:
        raise ValueError("Exam not found")

    result["_id"] = str(result["_id"])
    return result
