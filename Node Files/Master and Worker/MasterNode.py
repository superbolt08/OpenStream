import zmq
import struct
import cv2
import os
import time
import yt_dlp
import tempfile

# Configuration
RECONNECT_DELAY = 5
SEGMENT_DURATION = 5  # seconds
FPS = 30 #Default val
FRAME_WIDTH = 640
FRAME_HEIGHT = 360
# YOUTUBE_URL = "https://www.youtube.com/watch?v=jfKfPfyJRdk"
WORKER_SERVICE = os.getenv("WORKER_SERVICE", "worker-service:6000")

# # Fetch YouTube stream URL
# def get_youtube_stream_url(url):
#     ydl_opts = {
#         'quiet': True,
#         'format': 'best[ext=mp4]/best',
#         'noplaylist': True,
#     }
#     try:
#         print("Fetching YouTube stream URL...")
#         with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#             info = ydl.extract_info(url, download=False)
#             return info['url']
#     except Exception as e:
#         print(f"Error extracting stream URL: {e}")
#         return None

# # Get and validate stream
# stream_url = get_youtube_stream_url(YOUTUBE_URL)
# if not stream_url:
#     print("Error: Could not extract stream URL. Exiting.")
#     exit(1)

# VIDEO_STREAM_PRO = stream_url #Will replace with api request.
VIDEO_STREAM_PRO = 0
# Setup ZMQ socket
context = zmq.Context()
worker_socket = context.socket(zmq.PUSH)
worker_socket.connect(f"tcp://{WORKER_SERVICE}")

# Open video stream
def open_stream():
    cap = cv2.VideoCapture(VIDEO_STREAM_PRO)
    FPS = cap.get(cv2.CAP_PROP_FPS) or 30
    if not cap.isOpened():
        print(f"Failed to connect. Retrying in {RECONNECT_DELAY} seconds...")
        time.sleep(RECONNECT_DELAY)
        return None
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, FPS)
    return cap

cap = None
while cap is None:
    cap = open_stream()

print("Streaming started. Sending video segments to workers...")

try:
    while True:
        # Create a temporary file to store the segment
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmpfile:
            segment_path = tmpfile.name

        # Set up video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(segment_path, fourcc, FPS, (FRAME_WIDTH, FRAME_HEIGHT))

        # Record a segment
        start_time = time.time()
        while time.time() - start_time < SEGMENT_DURATION:
            ret, frame = cap.read()
            if not ret:
                print("Stream disconnected. Attempting to reconnect...")
                cap.release()
                cap = None
                while cap is None:
                    cap = open_stream()
                break
            out.write(frame)

            # Show locally
            cv2.imshow("Live Feed (Press 'z' to quit)", frame)
            if cv2.waitKey(1) & 0xFF == ord('z'):
                raise KeyboardInterrupt

        out.release()

        # Read and send the video segment
        try:
            with open(segment_path, 'rb') as f:
                video_data = f.read()
            os.remove(segment_path)
        except Exception as e:
            print(f"Failed to read/delete video segment: {e}")
            continue

        try:
            worker_socket.send(struct.pack(">L", len(video_data)) + video_data)
            print("Sent video segment to worker")
        except zmq.ZMQError as e:
            print(f"Error sending video segment to worker: {e}")

except KeyboardInterrupt:
    print("Exiting...")
    if cap:
        cap.release()
    cv2.destroyAllWindows()
