from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form
from examenes_backend.repo.temp_exams_repo import (
    insert_temp_exam,
    get_temp_exam,
    delete_temp_exam,
    update_temp_exam,
    grade_exam,
)
import tempfile
import os
from examenes_backend.orchestrator import process_full_pdf, split_pdf_into_exams
from typing import List, Dict

router = APIRouter(prefix="/temp-exams", tags=["Temporary Exams"])

def mongo_to_dict(doc):
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

async def process_sub_pdf(pdf_sub_bytes, index, rubric_id, comments, user_id, result):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmpfile:
        tmpfile.write(pdf_sub_bytes)
        tmpfile_path = tmpfile.name
    try:
        with open(tmpfile_path, "rb") as file_obj:
            upload_file = UploadFile(filename=f"subpdf_{index}.pdf", file=file_obj)
            graded = await grade_exam(
                pdf=upload_file,
                rubric_id=rubric_id,
                comments=comments,
                user_id=user_id
            )
            result.append(graded)
    finally:
        os.remove(tmpfile_path)

@router.get("/{temp_exam_id}")
async def get_temp_exam_endpoint(temp_exam_id: str):
    exam = get_temp_exam(temp_exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Temporary exam not found")
    exam["_id"] = str(exam["_id"])
    return exam

@router.put("/{temp_exam_id}")
async def update_temp_exam_endpoint(
    temp_exam_id: str,
    data: Dict = Body(...)
):
    correction = data.get("correction")
    if correction is None:
        raise HTTPException(status_code=400, detail="Field 'correction' is required")
    try:
        update_temp_exam(temp_exam_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Temporary correction updated"}

@router.delete("/{temp_exam_id}")
async def delete_temp_exam_endpoint(temp_exam_id: str):
    success = delete_temp_exam(temp_exam_id)
    if not success:
        raise HTTPException(status_code=404, detail="Temporary exam not found")
    return {"message": "Temporary exam deleted successfully"}

@router.post("/grade-batch")
async def grade_batch_exams(
    mode: str = Form(...),
    files: List[UploadFile] = File([]),
    rubric_id: str = Form(None),
    comments: str = Form(""),
    user_id: str = Form(...),
    pages_per_exam: int = Form(None),
):
    result = []

    if mode == "multiple":
        for file in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmpfile:
                tmpfile.write(await file.read())
                tmpfile_path = tmpfile.name
            try:
                with open(tmpfile_path, "rb") as file_obj:
                    upload_file = UploadFile(filename=file.filename, file=file_obj)
                    graded = await grade_exam(
                        pdf=upload_file,
                        rubric_id=rubric_id,
                        comments=comments,
                        user_id=user_id
                    )
                    result.append(graded)
            finally:
                os.remove(tmpfile_path)

    elif mode == "single" and files:
        pdf_bytes = await files[0].read()
        split_pdfs = split_pdf_into_exams(pdf_bytes, pages_per_exam)
        for index, pdf_sub_bytes in enumerate(split_pdfs, start=1):
            await process_sub_pdf(
                pdf_sub_bytes, index, rubric_id, comments, user_id, result
            )

    return {"results": result}

@router.post("/grade-single")
async def grade_exam_endpoint(
    pdf: UploadFile = File(...),
    rubric_id: str = Form(None),
    comments: str = Form(""),
    user_id: str = Form(...)
):
    try:
        result = await grade_exam(
            pdf=pdf,
            rubric_id=rubric_id,
            comments=comments,
            user_id=user_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
