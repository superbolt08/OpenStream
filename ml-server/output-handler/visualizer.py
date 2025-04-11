from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pymongo import MongoClient
import gridfs, io

app = FastAPI()

client = MongoClient("mongodb://mongo:27017/")
fs = gridfs.GridFS(client["processed"])

@app.get("/test")
def test():
    return {"status": "Server is running"}

@app.get("/segments")
def list_segments():
    return {"segments": [f.filename for f in fs.find()]}

@app.get("/segments/{filename}")
def stream_segment(filename: str):
    file = fs.find_one({"filename": filename})
    if not file:
        return {"error": "Not found"}
    return StreamingResponse(io.BytesIO(file.read()), media_type="video/mp4")
