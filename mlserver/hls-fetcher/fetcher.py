from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import subprocess, zmq, struct, threading, time, asyncio, os, tempfile
from bson import ObjectId  # Import ObjectId for handling MongoDB ObjectId

app = FastAPI()

# --- MongoDB setup ---
client = MongoClient("mongodb://mongo:27017/")
db = client["stream-db"]
collection = db["streams"]

# --- ZeroMQ setup ---
context = zmq.Context()
socket = context.socket(zmq.PUSH)
socket.connect("tcp://inference:6000")

# --- API Models ---
class StreamChoice(BaseModel):
    stream_id: str  # Expect stream_id to be a string that will be converted to ObjectId

class Stream(BaseModel):
    url: str
    name: str  # Add a name field for the stream (optional)

# --- Active thread tracker ---
active_threads = {}

# --- Inference and Visualizer placeholders ---
async def start_inference():
    while True:
        print("[inference] running...")
        await asyncio.sleep(2)

async def start_visualizer():
    while True:
        print("[visualizer] running...")
        await asyncio.sleep(2)

# --- Startup hook ---
@app.on_event("startup")
async def startup_tasks():
    asyncio.create_task(start_inference())
    asyncio.create_task(start_visualizer())

# --- Health check ---
@app.get("/")
def health_check():
    return {"status": "fetcher is running"}

# --- List available streams ---
@app.get("/streams")
def list_streams():
    streams = collection.find({}, {"_id": 1, "url": 1})
    return [{"id": str(s["_id"]), "url": s["url"]} for s in streams]

# --- Add a new stream ---
@app.post("/add_stream")
def add_stream(stream: Stream):
    # Insert the stream URL and name into the MongoDB collection
    new_stream = {
        "url": stream.url,
        "name": stream.name
    }
    result = collection.insert_one(new_stream)
    return {"status": f"Stream added with ID: {result.inserted_id}"}

@app.post("/start")
def start_stream(choice: StreamChoice):
    try:
        stream_id = ObjectId(choice.stream_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid stream_id format")

    doc = collection.find_one({"_id": stream_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Stream not found")

    stream_url = doc["url"]

    if choice.stream_id in active_threads:
        return {"status": "Already running"}

    def stream_loop():
        while choice.stream_id in active_threads:
            cmd = [
                "ffmpeg", "-i", stream_url,
                "-t", "5", "-f", "mp4",
                "-movflags", "frag_keyframe+empty_moov",
                "pipe:1"
            ]
            try:
                proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                data, err = proc.communicate()

                if not data:
                    print(f"[ERROR] No data received from ffmpeg for stream: {stream_url}")
                    print(f"[FFMPEG STDERR]:\n{err.decode()}")
                    break

                socket.send(struct.pack(">L", len(data)))
                socket.send(data)

            except Exception as e:
                print(f"[ERROR] Stream {choice.stream_id} failed: {e}")
                break
            time.sleep(1)

    t = threading.Thread(target=stream_loop, daemon=True)
    active_threads[choice.stream_id] = t
    t.start()

    return {"status": f"Started stream {choice.stream_id}"}

# --- Stop streaming ---
@app.post("/stop/{stream_id}")
def stop_stream(stream_id: str):
    if stream_id in active_threads:
        del active_threads[stream_id]
        return {"status": f"Stopped stream {stream_id}"}
    return {"status": "Not running"}

# --- Webcam test stream for Windows ---
@app.post("/test/webcam")
def test_webcam():
    tmp_path = os.path.join(tempfile.gettempdir(), "webcam_test.mp4")

    # You can replace "Integrated Webcam" with your actual webcam name
    # Run: ffmpeg -list_devices true -f dshow -i dummy to get webcam name
    cmd = [
        "ffmpeg", "-y",
        "-f", "dshow",
        "-i", 'video= ACER HD User Facing',
        "-t", "5",
        "-f", "mp4",
        "-movflags", "frag_keyframe+empty_moov",
        tmp_path
    ]

    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        with open(tmp_path, "rb") as f:
            data = f.read()
        socket.send(struct.pack(">L", len(data)))
        socket.send(data)

        return {"status": "Webcam segment captured and sent"}
    except Exception as e:
        return {"error": str(e)}
