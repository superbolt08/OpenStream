from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
import subprocess, zmq, struct, threading, time, asyncio

app = FastAPI()

# --- MongoDB setup ---
client = MongoClient("mongodb://mongo:27017/")
db = client["stream-db"]
collection = db["streams"]

# --- ZeroMQ setup ---
context = zmq.Context()
socket = context.socket(zmq.PUSH)
socket.connect("tcp://inference-node:6000")

# --- API Models ---
class StreamChoice(BaseModel):
    stream_id: str

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

# --- Startup hook to launch them ---
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

# --- Start streaming ---
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
            cmd = [
                "ffmpeg", "-i", stream_url,
                "-t", "5", "-f", "mp4",
                "-movflags", "frag_keyframe+empty_moov", "pipe:1"
            ]
            try:
                proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
                data = proc.stdout.read()
                proc.terminate()

                if data:
                    socket.send(struct.pack(">L", len(data)))
                    socket.send(data)
            except Exception as e:
                print(f"[ERROR] Stream {stream_id} failed: {e}")
                break
            time.sleep(1)

    t = threading.Thread(target=stream_loop, daemon=True)
    active_threads[stream_id] = t
    t.start()

    return {"status": f"Started stream {stream_id}"}

# --- Stop streaming ---
@app.post("/stop/{stream_id}")
def stop_stream(stream_id: str):
    if stream_id in active_threads:
        del active_threads[stream_id]
        return {"status": f"Stopped stream {stream_id}"}
    return {"status": "Not running"}
