from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import subprocess
import zmq
import struct
import os
import tempfile
import cv2
import time
import yt_dlp
import threading

app = FastAPI()

# MongoDB setup
client = MongoClient("mongodb://mongo:27017/")
db = client["your-db"]
collection = db["streams"]

# ZMQ setup (send to worker)
context = zmq.Context()
send_socket = context.socket(zmq.PUSH)
send_socket.connect("tcp://worker:6000")

# Constants
SEGMENT_DURATION = 5
FPS = 30
FRAME_WIDTH = 640
FRAME_HEIGHT = 360

# Thread tracking
active_threads = {}

# === Models ===
class StreamChoice(BaseModel):
    stream_id: str

class YouTubeRequest(BaseModel):
    url: str

# === Routes ===

@app.get("/test")
def test_endpoint():
    return {"message": "FastAPI is working!"}


@app.get("/streams")
def list_streams():
    streams = list(collection.find({}, {"_id": 1, "url": 1}))
    return [{"id": str(s["_id"]), "url": s["url"]} for s in streams]


@app.post("/start")
def start_stream(choice: StreamChoice):
    doc = collection.find_one({"_id": choice.stream_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Stream not found")

    stream_id = choice.stream_id
    stream_url = doc["url"]

    if stream_id in active_threads:
        return {"status": "Already running"}

    def stream_loop():
        while stream_id in active_threads:
            segment_path = os.path.join(tempfile.gettempdir(), f"{stream_id}_segment.mp4")
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", stream_url,
                "-t", str(SEGMENT_DURATION),
                "-c", "copy",
                segment_path
            ]
            subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            try:
                with open(segment_path, 'rb') as f:
                    data = f.read()
                    size = struct.pack(">L", len(data))
                    send_socket.send(size)
                    send_socket.send(data)
                os.remove(segment_path)
            except Exception as e:
                print(f"[ERROR] Failed to send segment: {e}")
                break

            time.sleep(1)

    t = threading.Thread(target=stream_loop, daemon=True)
    active_threads[stream_id] = t
    t.start()

    return {"status": f"Started stream for {stream_id}"}


@app.post("/stop/{stream_id}")
def stop_stream(stream_id: str):
    if stream_id in active_threads:
        del active_threads[stream_id]
        return {"status": f"Stream {stream_id} stopped"}
    return {"status": "Stream not running"}


@app.post("/start-youtube")
def process_youtube_url(body: YouTubeRequest):
    stream_url = get_youtube_stream_url(body.url)
    if not stream_url:
        raise HTTPException(status_code=500, detail="Could not extract stream URL")
    capture_and_send(stream_url)
    return {"status": "Segment captured and sent to worker"}


# === Helpers ===

def get_youtube_stream_url(url):
    ydl_opts = {
        'quiet': True,
        'format': 'best[ext=mp4]/best',
        'noplaylist': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']
    except Exception as e:
        print(f"[ERROR] yt-dlp: {e}")
        return None


def capture_and_send(stream_url):
    segment_path = os.path.join(tempfile.gettempdir(), "yt_segment.mp4")
    timestamp = int(time.time())
    save_dir = "/app/segments"
    os.makedirs(save_dir, exist_ok=True)
    local_path = os.path.join(save_dir, f"yt_segment_{timestamp}.mp4")

    try:
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", stream_url,
            "-t", str(SEGMENT_DURATION),
            "-vf", f"scale={FRAME_WIDTH}:{FRAME_HEIGHT}",
            "-r", str(FPS),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-c:a", "aac",
            segment_path
        ]
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        with open(segment_path, 'rb') as f:
            data = f.read()
            size = struct.pack(">L", len(data))

            # Save to yolo-backend container
            with open(local_path, 'wb') as local_out:
                local_out.write(data)

            # Send to worker
            send_socket.send(size)
            send_socket.send(data)

        os.remove(segment_path)
        print(f"[SAVED] Segment also saved at: {local_path}")

    except Exception as e:
        print(f"[ERROR] Failed to save/send segment: {e}")
