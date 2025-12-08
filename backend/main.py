from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import uuid
import traceback
from utils.audio import extract_audio
from utils.translate import translate_text
from utils.subtitles import generate_srt
from utils.burn import burn_subtitles
import mimetypes

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

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
    uvicorn.run(app, host="0.0.0.0", port=port)
