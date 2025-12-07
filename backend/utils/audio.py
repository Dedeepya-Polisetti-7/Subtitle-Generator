import ffmpeg

def extract_audio(video_path, output_audio):
    (
        ffmpeg
        .input(video_path)
        .output(output_audio, ac=1, ar=16000)
        .overwrite_output()
        .run(quiet=True)
    )