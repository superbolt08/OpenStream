import cv2
import time
import yt_dlp

# Step 1: Extract stream URL using yt_dlp
youtube_url = "https://www.youtube.com/watch?v=jfKfPfyJRdk"  # Lo-fi chill music live stream

ydl_opts = {
    'quiet': True,
    'format': 'best[ext=mp4]/best',
    'noplaylist': True,
}

print("Fetching YouTube stream URL...")

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(youtube_url, download=False)
    stream_url = info['url']

print("Stream URL extracted!")
print("Opening stream...")

# Step 2: Open video stream with OpenCV
cap = cv2.VideoCapture(stream_url)

if not cap.isOpened():
    print("Failed to open the stream.")
    exit(1)

print("Stream opened successfully!")

# Step 3: Read and display frames
frame_count = 0
max_frames = 10000  # adjust if needed

while frame_count < max_frames:
    ret, frame = cap.read()
    if not ret:
        print("Failed to read frame.")
        break

    cv2.imshow("YouTube Live Stream", frame)
    frame_count += 1
    time.sleep(0.02)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("User exited.")
        break

# Step 4: Cleanup
cap.release()
cv2.destroyAllWindows()
print("Stream test completed.")
