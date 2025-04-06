import zmq
import struct
import os
import tempfile
import cv2
import torch
from pymongo import MongoClient
import gridfs
import pandas as pd
from PIL import Image
import numpy as np
# Setup MongoDB GridFS
client = MongoClient("mongodb://mongo:27017/")
fs = gridfs.GridFS(client["processed"])

# Use CPU for inference
device = torch.device('cpu')
print("[WORKER] Loading YOLOv5n on CPU...")
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', pretrained=True)
model.to(device)
model.eval()
print("[WORKER] YOLOv5n ready.")

# Setup ZMQ
context = zmq.Context()
recv_socket = context.socket(zmq.PULL)
recv_socket.bind("tcp://0.0.0.0:6000")

# Optional local save directory
SAVE_DIR = "/app/segments"
os.makedirs(SAVE_DIR, exist_ok=True)

segment_counter = 0

def worker_loop():
    global segment_counter
    print("[WORKER] Waiting for video segments...")

    while True:
        try:
            # Receive segment
            size_data = recv_socket.recv(4)
            size = struct.unpack(">L", size_data)[0]
            segment_data = recv_socket.recv(size)

            # Save segment temporarily
            tmp_path = os.path.join(tempfile.gettempdir(), f"segment_{segment_counter}.mp4")
            with open(tmp_path, 'wb') as f:
                f.write(segment_data)

            # Read video info
            cap = cv2.VideoCapture(tmp_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Output path
            out_path = os.path.join(SAVE_DIR, f"segment_{segment_counter:03}_yolo.mp4")
            out = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

            # Process and annotate
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                results = model(frame)
                annotated = results.render()[0]
                out.write(annotated)

            cap.release()
            out.release()
            os.remove(tmp_path)

            # ✅ Now store to MongoDB
            with open(out_path, 'rb') as f:
                fs.put(f, filename=os.path.basename(out_path))

            print(f"[WORKER] Saved and uploaded: {out_path}")
            segment_counter += 1

        except Exception as e:
            print(f"[WORKER ERROR] {e}")

if __name__ == "__main__":
    worker_loop()
