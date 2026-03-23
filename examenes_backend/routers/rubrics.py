from fastapi import APIRouter, HTTPException
from examenes_backend.repo.rubric_repo import (
    create_rubric,
    get_rubrics,
    update_rubric,
    delete_rubric,
    get_rubric_by_id,
)

router = APIRouter(prefix="/rubrics", tags=["Rubrics"])

@router.post("/create")
async def create_rubric_endpoint(rubric: dict):
    if not rubric.get("creator") or not rubric.get("name") or not rubric.get("questions"):
        raise HTTPException(status_code=400, detail="Missing required fields")

    for question in rubric["questions"]:
        if "text" not in question or not question["text"]:
            raise HTTPException(status_code=400, detail="Missing text in one of the questions")
        if "criteria" not in question or not question["criteria"]:
            raise HTTPException(status_code=400, detail="Missing criteria in one of the questions")

        for criterion in question["criteria"]:
            if not all(k in criterion for k in ("description", "points")):
                raise HTTPException(status_code=400, detail="Invalid criterion format in one of the questions")

    rubric_id = create_rubric(rubric)

    return {"message": "Rubric created successfully", "id": rubric_id}

@router.get("/{teacher_email}")
async def get_rubrics_endpoint(teacher_email: str):
    return get_rubrics(teacher_email)

@router.get("/get/{rubric_id}")
async def get_rubric_by_id_endpoint(rubric_id: str):
    rubric = get_rubric_by_id(rubric_id)
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    return rubric

@router.put("/{rubric_id}")
async def update_rubric_endpoint(rubric_id: str, new_data: dict):
    if update_rubric(rubric_id, new_data):
        return {"message": "Rubric updated"}
    else:
        raise HTTPException(status_code=404, detail="Rubric not found")

@router.delete("/{rubric_id}")
async def delete_rubric_endpoint(rubric_id: str):
    if delete_rubric(rubric_id):
        return {"message": "Rubric deleted"}
    else:
        raise HTTPException(status_code=404, detail="Rubric not found")
