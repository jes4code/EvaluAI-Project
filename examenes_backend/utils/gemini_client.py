import os
import json
import re
import google.generativeai as genai
import base64
import time
from typing import Optional, Dict, List
from google.generativeai import types


GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in environment variables")


genai.configure(api_key=GOOGLE_API_KEY)


MODEL_NAME = "gemini-2.5-flash"
REQUEST_DELAY = 2
MAX_RETRIES = 3


def extract_json(text: str) -> Optional[str]:
    if not text:
        return None

    m = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1)

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]

    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]

    return None


def clean_json_string(json_str: str) -> str:
    if not isinstance(json_str, str):
        raise ValueError("Extracted JSON is empty or not a string (probably truncated).")
    return re.sub(r"(?<!\\)[\n\r\t]", " ", json_str)


def build_response(pdf_file: str, correction_data: dict) -> dict:
    correction = correction_data.get("correction", [])

    assigned_grade = sum(
        float(item.get("assigned_score", 0) or 0) for item in correction
    )
    max_grade = sum(
        float(item.get("max_score", 0) or 0) for item in correction
    )

    return {
        "metadata": {
            "pdf_file": pdf_file,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        },
        "correction": correction,
        "general_comment": correction_data.get("general_comment", ""),
        "student_name": correction_data.get("student_name", ""),
        "assigned_grade": assigned_grade,
        "max_grade": max_grade,
    }



def send_image(
    prompt: str,
    pdf_file: str,
    page_number: int,
    image_base64: str
) -> Optional[Dict]:
    for attempt in range(MAX_RETRIES):
        try:
            if "base64," in image_base64:
                image_base64 = image_base64.split("base64,")[1]
            img_bytes = base64.b64decode(image_base64)

            model = genai.GenerativeModel(MODEL_NAME)
            generation_config = {
                "temperature": 0.3,
                "max_output_tokens": 8000
            }

            llm_prompt = prompt

            response = model.generate_content(
                contents=[
                    {"mime_type": "image/png", "data": img_bytes},
                    llm_prompt
                ],
                generation_config=generation_config
            )

            raw_text = response.text.strip()
            json_str = extract_json(raw_text)
            print("Extracted JSON string:\n", json_str)
            if not json_str:
                raise ValueError("Response does not contain valid JSON")

            if json_str and json_str.strip().startswith("{") and not json_str.strip().startswith("["):
                if re.search(r"}\s*,\s*{", json_str):
                    json_str = "[" + json_str + "]"

            json_str = clean_json_string(json_str)
            json_data = json.loads(json_str)
            if isinstance(json_data, list):
                for item in json_data:
                    print("Item:", item)
                return build_response(pdf_file, json_data[0])
            else:
                return build_response(pdf_file, json_data)

        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == MAX_RETRIES - 1:
                return None
            time.sleep(REQUEST_DELAY * (attempt + 1))


def send_pdf_to_gemini(pdf_bytes: bytes, prompt: str, pdf_filename: str):
    model = genai.GenerativeModel(MODEL_NAME)
    generation_config = {
        "temperature": 0.3,
        "max_output_tokens": 8000
    }
    response = model.generate_content(
        contents=[
            {"mime_type": "application/pdf", "data": pdf_bytes},
            prompt
        ],
        generation_config=generation_config
    )
    finish_reason = None
    try:
        finish_reason = response.candidates[0].finish_reason
    except Exception:
        pass

    if str(finish_reason) == "MAX_TOKENS" or getattr(finish_reason, "name", "") == "MAX_TOKENS":
        raise ValueError("TRUNCATED_MAX_TOKENS")

    print("Full model response:\n", response)

    if hasattr(response, "text") and response.text:
        raw_text = response.text.strip()
        print("Raw text (response.text):\n", raw_text)
    else:
        print("Response does not contain 'text' attribute or it is empty.")
        raise ValueError("Empty model response or missing 'text' attribute.")

    json_str = extract_json(raw_text)
    print("Extracted JSON string:\n", json_str)

    if not json_str:
        raise ValueError("Could not extract JSON (probably truncated or missing full ```json``` block).")

    json_str = clean_json_string(json_str)
    print("Clean JSON string:\n", json_str)

    try:
        json_data = json.loads(json_str)
    except json.JSONDecodeError as jde:
        print("Error parsing JSON:\n", json_str)
        print("Error details:", str(jde))
        raise

    if isinstance(json_data, dict):
        correction = json_data.get("correction", [])
        general_comment = json_data.get("general_comment", "")
        student_name = json_data.get("student_name", "")
    elif isinstance(json_data, list):
        correction = json_data
        general_comment = ""
        student_name = ""
    else:
        correction = []
        general_comment = ""
        student_name = ""

    final_response = {
        "correction": correction,
        "general_comment": general_comment,
        "student_name": student_name
    }

    return build_response(pdf_filename, final_response)
