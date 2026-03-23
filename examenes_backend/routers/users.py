from fastapi import APIRouter, HTTPException
from examenes_backend.repo.user_repo import create_user, validate_user, get_user_by_email

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
async def register(user: dict):
    try:
        user_id = create_user(user)
        return {"message": "User created successfully", "id": user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    if validate_user(email, password):
        user_info = get_user_by_email(email)
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        user_info["_id"] = str(user_info["_id"])
        return {
            "message": "Login successful",
            "user": {
                "id": user_info["_id"],
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "role": user_info.get("role")
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
