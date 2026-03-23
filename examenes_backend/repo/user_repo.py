from examenes_backend.database import db
from passlib.context import CryptContext
from datetime import datetime, timezone

collection = db["users"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_user(user_json):
    if collection.find_one({"email": user_json["email"]}):
        raise ValueError("Email is already registered")

    user_json["password_hash"] = hash_password(user_json.pop("password"))
    user_json["registration_date"] = datetime.now(timezone.utc)

    result = collection.insert_one(user_json)
    return str(result.inserted_id)

def get_user_by_email(email: str):
    return collection.find_one({"email": email}, {"password_hash": 0})

def validate_user(email: str, password: str):
    user = collection.find_one({"email": email})
    if not user:
        return False
    return verify_password(password, user["password_hash"])
