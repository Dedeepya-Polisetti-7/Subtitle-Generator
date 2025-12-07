import ffmpeg


def burn_subtitles(video_path, srt_path, output_path):
    """Burn subtitles into the video while preserving the audio stream.

    Uses ffmpeg to apply the subtitles video filter (`-vf subtitles=...`) and
    copies the audio stream (`-c:a copy`) to avoid re-encoding or dropping audio.
    """
    try:
        # Use the subtitles filter on the video and copy the audio stream
        (
            ffmpeg
            .input(video_path)
            .output(output_path, vf=f"subtitles={srt_path}", vcodec='libx264', acodec='copy')
            .overwrite_output()
            .run(quiet=True)
        )
    except ffmpeg.Error as e:
        # Log ffmpeg stderr for debugging
        err = e.stderr.decode() if isinstance(e.stderr, (bytes, bytearray)) else str(e)
        print(f"ffmpeg error while burning subtitles: {err}")
        raise