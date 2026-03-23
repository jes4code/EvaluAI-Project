from examenes_backend.database import db
from bson import ObjectId

collection = db["rubrics"]

def create_rubric(rubric_json):
    result = collection.insert_one(rubric_json)
    return str(result.inserted_id)

def get_rubrics(teacher_email):
    rubrics = list(collection.find({"creator": teacher_email}))
    for rubric in rubrics:
        rubric["_id"] = str(rubric["_id"])
    return rubrics

def update_rubric(rubric_id, new_data):
    result = collection.update_one(
        {"_id": ObjectId(rubric_id)},
        {"$set": new_data}
    )
    return result.modified_count > 0

def delete_rubric(rubric_id):
    result = collection.delete_one({"_id": ObjectId(rubric_id)})
    return result.deleted_count > 0

def get_rubric_by_id(rubric_id):
    doc = collection.find_one({"_id": ObjectId(rubric_id)})
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc
