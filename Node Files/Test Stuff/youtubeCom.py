import yt_dlp

url = "https://www.youtube.com/watch?v=jfKfPfyJRdk"

ydl_opts = {
    'quiet': True,
    'format': 'best[ext=mp4]/best',
    'noplaylist': True,
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(url, download=False)
    stream_url = info['url']
    print("Stream URL:", stream_url)
