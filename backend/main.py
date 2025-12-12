# backend/main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
<<<<<<< HEAD
import uvicorn
=======
import sqlite3
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
>>>>>>> aaabbd8 (file Updated)
import uuid
import traceback
from utils.audio import extract_audio
from utils.translate import translate_text
from utils.subtitles import generate_srt
from utils.burn import burn_subtitles
import mimetypes
import smtplib
from email.message import EmailMessage
import hashlib
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

load_dotenv()

# ---------- CONFIG ----------
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_123")
ALGO = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXP_DAYS = int(os.getenv("JWT_EXP_DAYS", "7"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# CORS Configuration - limit to your frontend in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DB_PATH", "users.db")

def get_db_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

def preprocess_password(raw_password: str) -> str:
    """
    Fix bcrypt 72-byte limit by pre-hashing with SHA-256 before bcrypt.
    """
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


# ------------------ Helpers: JWT & Auth ------------------
def create_jwt(payload: dict, days: int = JWT_EXP_DAYS):
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(days=days)
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGO)
    return token

def decode_jwt(token: str):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
        return data
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str = Header(None, alias="Authorization")):
    # Expect header: Authorization: Bearer <token>
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")
    if token.startswith("Bearer "):
        token = token.split(" ", 1)[1]
    data = decode_jwt(token)
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, email FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": row["id"], "email": row["email"]}

# ------------------ Email helper ------------------
def send_reset_email(to_email: str, token: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        # In dev you might want to print the link instead of sending
        print("SMTP not configured. Reset token (dev only):", token)
        return

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    msg = EmailMessage()
    msg["Subject"] = "Your password reset link"
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    html = f"""
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the link below to set a new password.</p>
    <p><a href="{reset_link}">Reset my password</a></p>
    <p>If you didn't request this, you can ignore this message.</p>
    <p>This link expires in 1 hour.</p>
    """
    msg.set_content(f"Reset your password: {reset_link}")
    msg.add_alternative(html, subtype='html')

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        # don't leak SMTP errors to the caller
        print("Failed to send email:", e)
        raise

# ------------------ Token helpers ------------------
def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def create_reset_token_for_user(user_id: int, expiry_minutes: int = 60):
    raw_token = uuid.uuid4().hex + uuid.uuid4().hex  # long random
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    conn = get_db_conn()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat()
    cur.execute("""
        INSERT INTO password_reset_tokens(user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?)
    """, (user_id, token_hash, expires_at.isoformat(), now))
    conn.commit()
    conn.close()
    return raw_token

def verify_reset_token(raw_token: str):
    token_hash = hash_token(raw_token)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, user_id, expires_at, used FROM password_reset_tokens
        WHERE token_hash = ?
        ORDER BY id DESC LIMIT 1
    """, (token_hash,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    if row["used"]:
        return None
    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        return None
    return {"id": row["id"], "user_id": row["user_id"]}

def mark_token_used(token_id: int):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (token_id,))
    conn.commit()
    conn.close()

# ------------------ Auth endpoints ------------------

@app.post("/register")
async def register_user(email: str = Form(...), password: str = Form(...)):
    """
    Registers a new user.
    Normalizes email (strip + lower) to avoid duplicate accounts by casing/whitespace.
    Returns JSON with success flag and message.
    """
    email_clean = (email or "").strip().lower()
    if not email_clean or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    try:
        conn = get_db_conn()
        cur = conn.cursor()
        # Check explicitly
        cur.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        row = cur.fetchone()
        if row is not None:
            conn.close()
            return JSONResponse({"success": False, "message": "Email already registered. Try logging in."}, status_code=400)

        def preprocess_password(password: str):
            # Fix for bcrypt max length (72 bytes)
            password = password.encode('utf-8')
            sha256 = hashlib.sha256(password).hexdigest()  # 64 chars
            return sha256

        hashed_password = pwd_context.hash(preprocess_password(password))

        now = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO users (email, password, created_at, updated_at) VALUES (?, ?, ?, ?)
        """, (email_clean, hashed_password, now, now))
        conn.commit()
        conn.close()
        print(f"[REGISTER] Created user: {email_clean}")
        return {"success": True, "message": "Registration successful"}
    except Exception as e:
        print("[REGISTER] Exception:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Server error during registration")

@app.post("/login")
async def login_user(email: str = Form(...), password: str = Form(...)):
    """
    Login endpoint. Normalizes email.
    Returns token on success, or clear error message on failure.
    """
    email_clean = (email or "").strip().lower()
    if not email_clean or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, password FROM users WHERE email = ?", (email_clean,))
        row = cur.fetchone()
        conn.close()

        if row is None:
            print(f"[LOGIN] User not found: {email_clean}")
            return JSONResponse({"success": False, "message": "Invalid email or password"}, status_code=400)

        stored_hash = row["password"]
        if not pwd_context.verify(preprocess_password(password), stored_hash):
            print(f"[LOGIN] Password mismatch for: {email_clean}")
            return JSONResponse({"success": False, "message": "Invalid email or password"}, status_code=400)

        token = create_jwt({"email": email_clean})
        print(f"[LOGIN] Success: {email_clean}")
        return {"success": True, "token": token, "email": email_clean}
    except Exception as e:
        print("[LOGIN] Exception:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Server error during login")

@app.post("/forgot-password")
async def forgot_password(email: str = Form(...)):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = ?", ((email or "").strip().lower(),))
    row = cur.fetchone()

    # Security: do not reveal existence
    if not row:
        return {"success": True, "message": "If this email is registered, a password reset link will be sent."}

    user_id = row["id"]
    raw_token = create_reset_token_for_user(user_id, expiry_minutes=60)
    try:
        send_reset_email(email.strip().lower(), raw_token)
    except Exception as e:
        print("Email error:", e)
        traceback.print_exc()
        return {"success": False, "message": "Failed to send reset email. Contact admin."}

    return {"success": True, "message": "If this email is registered, a password reset link will be sent."}

@app.post("/reset-password")
async def reset_password(token: str = Form(...), new_password: str = Form(...)):
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")

    verified = verify_reset_token(token)
    if not verified:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_id = verified["user_id"]
    token_id = verified["id"]

    hashed_password = pwd_context.hash(preprocess_password(new_password))
    conn = get_db_conn()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat()
    cur.execute("UPDATE users SET password = ?, updated_at = ? WHERE id = ?", (hashed_password, now, user_id))
    conn.commit()
    conn.close()

    mark_token_used(token_id)

    return {"success": True, "message": "Password has been reset. You can now log in with your new password."}

@app.post("/change-password")
async def change_password(old_password: str = Form(...), new_password: str = Form(...), current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT password FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if not pwd_context.verify(old_password, row["password"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Old password incorrect")

    hashed = pwd_context.hash(preprocess_password(new_password))
    now = datetime.utcnow().isoformat()
    cur.execute("UPDATE users SET password = ?, updated_at = ? WHERE id = ?", (hashed, now, user_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Password updated successfully."}

# ------------------ Debug helper (dev only) ------------------
@app.get("/debug/users")
async def debug_users():
    """List users (for local dev only). Remove or protect this in production."""
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, email, created_at, updated_at FROM users ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    return {"users": [dict(r) for r in rows]}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Backend is running"}

@app.post("/upload")
async def upload_video(video: UploadFile = File(...), language: str = Form("english"), source_lang: str = Form("english"), burn: str = Form("false")):
    """Upload and process video to generate subtitles
    
    Args:
        video: Video file to upload
        language: Target language for subtitles (default: english)
        source_lang: Source language of audio (default: english, usually Whisper transcribes to English)
        burn: Whether to burn subtitles into video (default: false)
    """
    try:
        # Validate file
        if not video.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Unique filenames
        file_id = str(uuid.uuid4())
        input_video = f"{UPLOAD_DIR}/{file_id}.mp4"
        audio_file = f"{UPLOAD_DIR}/{file_id}.wav"
        srt_file = f"{UPLOAD_DIR}/{file_id}.srt"
        final_video = f"{OUTPUT_DIR}/{file_id}_final.mp4"
        
        # Save uploaded video
        with open(input_video, "wb") as f:
            contents = await video.read()
            if not contents:
                raise HTTPException(status_code=400, detail="File is empty")
            f.write(contents)
        
        # Step 1: Extract Audio
        extract_audio(input_video, audio_file)
        
        # Step 2: Transcribe + Translate (now with source language support)
        subtitles = translate_text(audio_file, language, source_lang)
        
        # Step 3: Create SRT
        generate_srt(subtitles, srt_file)

        response_payload = {
            "status": "success",
            "subtitles": subtitles,
            "srt_file": os.path.basename(srt_file)
        }

        # Optionally burn subtitles into video if requested
        burn_requested = str(burn).lower() in ("1", "true", "yes")
        if burn_requested:
            try:
                burn_subtitles(input_video, srt_file, final_video)
                response_payload["burned_video"] = os.path.basename(final_video)
            except Exception as be:
                # Log burn error but still return subtitles
                print(f"Error burning subtitles: {be}")
                traceback.print_exc()
                response_payload["burn_error"] = str(be)

        # Return subtitles as JSON (frontend will handle display)
        return JSONResponse(response_payload)
    
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing video: {str(e)}"
        )
    finally:
        # Cleanup uploaded file
        if os.path.exists(input_video):
            os.remove(input_video)

@app.post("/process")
async def process_video(video: UploadFile = File(...), target_lang: str = Form("english"), source_lang: str = Form("english")):
    """Legacy endpoint for backward compatibility
    
    Args:
        video: Video file to upload
        target_lang: Target language for subtitles
        source_lang: Source language of audio (usually English from Whisper)
    """
    try:
        # Unique filenames
        file_id = str(uuid.uuid4())
        input_video = f"{UPLOAD_DIR}/{file_id}.mp4"
        audio_file = f"{UPLOAD_DIR}/{file_id}.wav"
        srt_file = f"{UPLOAD_DIR}/{file_id}.srt"
        final_video = f"{OUTPUT_DIR}/{file_id}_final.mp4"

        # Save uploaded video
        with open(input_video, "wb") as f:
            f.write(await video.read())

        # Step 1: Extract Audio
        extract_audio(input_video, audio_file)

        # Step 2: Transcribe + Translate (now with source language support)
        text = translate_text(audio_file, target_lang, source_lang)

        # Step 3: Create SRT
        generate_srt(text, srt_file)

        # Step 4: Burn Subtitles into Video
        burn_subtitles(input_video, srt_file, final_video)

        return FileResponse(final_video, media_type="video/mp4", filename="output.mp4")
    
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/srt/{filename}")
async def download_srt(filename: str):
    """Serve generated SRT files from the uploads directory"""
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_DIR, safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="text/plain", filename=safe_name)


@app.get("/download/output/{filename}")
async def download_output(filename: str):
    """Serve files from outputs directory (burned videos)"""
    safe_name = os.path.basename(filename)
    path = os.path.join(OUTPUT_DIR, safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    media_type, _ = mimetypes.guess_type(path)
    if media_type is None:
        media_type = "application/octet-stream"
    return FileResponse(path, media_type=media_type, filename=safe_name)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port,reload=False)
