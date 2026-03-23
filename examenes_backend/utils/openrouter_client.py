import time
import json
import re
from openai import OpenAI
import base64
import os
import unicodedata


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("Missing OPENROUTER_API_KEY in environment variables")


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)


def sanitize_filename(filename):
    """
    Converts a filename with non-ASCII characters into an ASCII-compatible name.
    """
    filename = unicodedata.normalize("NFKD", filename).encode("ASCII", "ignore").decode("ASCII")
    filename = filename.replace(" ", "_").lower()
    return filename


def send_image(prompt, pdf_file, page_number, image_base64=None, image_url=None):
    """
    Sends a prompt with text and image (base64 or URL) to a multimodal LLM and receives the raw response.
    """
    if image_base64:
        image_data_url = f"data:image/png;base64,{image_base64}"
    elif image_url:
        image_data_url = image_url
    else:
        image_data_url = None

    json_instruction = "\n\nRespond only in valid JSON format. "
    prompt_with_context = f"{prompt}\n\nFile: {pdf_file}, Page: {page_number}.{json_instruction}"
    prompt_with_context = prompt_with_context.encode("utf-8", "ignore").decode("utf-8")

    try:
        response = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "http://localhost",
            },
            model="google/gemini-2.0-flash-thinking-exp:free",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt_with_context}
                ]
            }] + (
                [{"type": "image_url", "image_url": {"url": image_data_url}}] if image_data_url else []
            ),
            max_tokens=1024
        )

        text = response.choices[0].message.content

        print(f"Raw LLM response:\n{text}\n")

        return {
            "pdf_file": pdf_file,
            "page_number": page_number,
            "raw_response": text
        }

    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        time.sleep(2)
