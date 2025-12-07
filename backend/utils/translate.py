from faster_whisper import WhisperModel
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer
from functools import lru_cache

# Load whisper for transcription
whisper = WhisperModel("small", device="cpu", compute_type="int8")

# Language code mapping
LANG_CODES = {
    "english": "en",
    "hindi": "hi",
    "french": "fr",
    "spanish": "es",
    "german": "de",
    "portuguese": "pt",
    "chinese": "zh",
    "japanese": "ja",
    "korean": "ko",
    "russian": "ru",
    "arabic": "ar",
    "italian": "it",
    "dutch": "nl",
    "polish": "pl",
    "turkish": "tr",
    "vietnamese": "vi",
    "thai": "th"
}

@lru_cache(maxsize=1)
def get_m2m_model():
    """Load and cache the M2M100 multilingual model and tokenizer."""
    try:
        print("Loading M2M100 multilingual translation model...")
        tok = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M")
        mod = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")
        print("M2M100 model loaded successfully")
        return tok, mod
    except Exception as e:
        print(f"Error loading M2M100 model: {e}")
        return None, None

def format_timestamp(seconds):
    """Convert seconds to SRT timestamp format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def translate_segment(text, tokenizer, model, src_lang, tgt_lang):
    """Translate a single text segment using M2M100.
    
    Args:
        text: Text to translate
        tokenizer: M2M100Tokenizer instance
        model: M2M100ForConditionalGeneration instance
        src_lang: Source language code (e.g., 'en', 'ko')
        tgt_lang: Target language code
    
    Returns:
        Translated text or original on failure
    """
    try:
        # Set source language
        tokenizer.src_lang = src_lang
        
        # Encode
        encoded = tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
        
        # Get target language ID
        try:
            forced_bos = tokenizer.get_lang_id(tgt_lang)
        except Exception:
            print(f"Warning: Target language '{tgt_lang}' not found in M2M100; will use default decoding")
            forced_bos = None
        
        # Generate translation
        if forced_bos is not None:
            generated = model.generate(**encoded, forced_bos_token_id=forced_bos, max_length=1024)
        else:
            generated = model.generate(**encoded, max_length=1024)
        
        # Decode
        translated = tokenizer.decode(generated[0], skip_special_tokens=True)
        return translated
    except Exception as e:
        print(f"Translation error ({src_lang}->{tgt_lang}): {e}")
        return text


def translate_text(audio_file, target_lang="english", source_lang=None):
    """
    Transcribe audio and translate to the requested target language using M2M100.

    Flow:
      1. Transcribe with Whisper (detects and transcribes in source language)
      2. If source_language == target_language: return as-is
      3. Else: use M2M100 to translate source -> target directly

    Args:
        audio_file: Path to audio file
        target_lang: Target language name or code for subtitles
        source_lang: Optional user-provided source language (will attempt to use if provided)

    Returns:
        List of subtitle dictionaries with time and text
    """
    try:
        # Map language names to codes
        tgt_code = LANG_CODES.get(target_lang.lower(), target_lang.lower())

        print(f"=== Transcription & Translation Pipeline ===")
        print(f"Target language: {target_lang} ({tgt_code})")

        # Transcribe audio (Whisper detects source language)
        print("Transcribing audio with Whisper...")
        segments, info = whisper.transcribe(audio_file, beam_size=5)

        # Determine detected source language from Whisper
        detected_src = None
        if info and isinstance(info, dict):
            detected_src = info.get("language") or info.get("lang")
        
        # Allow user override
        if source_lang:
            detected_src = LANG_CODES.get(source_lang.lower(), source_lang.lower())
        
        if not detected_src:
            detected_src = "en"

        print(f"Detected source language: {detected_src}")

        subtitles = []

        # If source == target, no translation needed
        if detected_src == tgt_code:
            print(f"Source and target languages match; returning transcription as-is")
            for segment in segments:
                start_time = format_timestamp(segment.start)
                end_time = format_timestamp(segment.end)
                time_str = f"{start_time} --> {end_time}"
                subtitles.append({
                    "time": time_str,
                    "text": segment.text.strip(),
                    "start": segment.start,
                    "end": segment.end
                })
            return subtitles

        # Load M2M100 model
        tokenizer, model = get_m2m_model()
        if tokenizer is None or model is None:
            print("ERROR: Failed to load M2M100 model; returning original transcription")
            for segment in segments:
                start_time = format_timestamp(segment.start)
                end_time = format_timestamp(segment.end)
                time_str = f"{start_time} --> {end_time}"
                subtitles.append({
                    "time": time_str,
                    "text": segment.text.strip(),
                    "start": segment.start,
                    "end": segment.end
                })
            return subtitles

        # Translate each segment from source -> target
        print(f"Translating {detected_src} -> {tgt_code}...")
        for segment in segments:
            translated_text = translate_segment(segment.text, tokenizer, model, detected_src, tgt_code)
            start_time = format_timestamp(segment.start)
            end_time = format_timestamp(segment.end)
            time_str = f"{start_time} --> {end_time}"

            subtitles.append({
                "time": time_str,
                "text": translated_text.strip(),
                "start": segment.start,
                "end": segment.end
            })

        print(f"Translation complete: {len(subtitles)} subtitle(s) generated")
        return subtitles

    except Exception as e:
        print(f"Error in translate_text: {e}")
        import traceback
        traceback.print_exc()
        raise