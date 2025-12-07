import srt
from datetime import timedelta


def generate_srt(text_or_subs, output_file):
    """Generate an SRT file.

    Accepts either:
      - a string (old behavior): splits into sentences and assigns 3s durations
      - a list of subtitle dicts (new behavior) where each item contains
        'text' and optionally 'start' and 'end' (seconds)
    """
    subs = []

    # If input is a list of subtitle objects (from translate.py), use timestamps
    if isinstance(text_or_subs, list):
        for i, item in enumerate(text_or_subs):
            # support either dict-like or simple strings
            if isinstance(item, dict):
                content = item.get("text", "")
                start_sec = item.get("start")
                end_sec = item.get("end")
            else:
                content = str(item)
                start_sec = None
                end_sec = None

            # Fallback durations when start/end not provided
            if start_sec is None or end_sec is None:
                duration = 3
                start = i * duration
                end = start + duration
            else:
                start = float(start_sec)
                end = float(end_sec)

            sub = srt.Subtitle(
                index=i + 1,
                start=timedelta(seconds=start),
                end=timedelta(seconds=end),
                content=content.strip()
            )
            subs.append(sub)

    else:
        # Legacy behavior: split a block of text into short subtitles
        text = str(text_or_subs)
        lines = [l.strip() for l in text.split(". ") if l.strip()]
        start = 0
        for i, line in enumerate(lines):
            duration = 3  # each subtitle lasts 3 seconds
            sub = srt.Subtitle(
                index=i + 1,
                start=timedelta(seconds=start),
                end=timedelta(seconds=start + duration),
                content=line
            )
            subs.append(sub)
            start += duration

    srt_text = srt.compose(subs)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(srt_text)