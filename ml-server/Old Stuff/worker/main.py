import zmq
import struct
import os
import tempfile
import subprocess
import cv2
import torch

# Leveraged towards CPU
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

# Save location
SAVE_DIR = "/app/segments"
os.makedirs(SAVE_DIR, exist_ok=True)

# Load YOLOv5n model
print("[WORKER] Loading YOLOv5n...")
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', pretrained=True)
model.eval()
print("[WORKER] YOLOv5n ready.")

segment_counter = 0

def worker_loop():
    global segment_counter
    print("[WORKER] Waiting for segments...")

    while True:
        try:
            # Receive video segment
            size_data = recv_socket.recv(4)
            size = struct.unpack(">L", size_data)[0]
            segment_data = recv_socket.recv(size)

            # Save raw input temporarily
            temp_input = os.path.join(tempfile.gettempdir(), f"segment_raw_{segment_counter}.mp4")
            with open(temp_input, 'wb') as f:
                f.write(segment_data)

            # Open input video
            cap = cv2.VideoCapture(temp_input)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Output annotated video
            final_output_path = os.path.join(SAVE_DIR, f"segment_{segment_counter:03}_yolo.mp4")
            out = cv2.VideoWriter(final_output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                results = model(frame)
                annotated = results.render()[0]
                out.write(annotated)

            cap.release()
            out.release()
            os.remove(temp_input)

            print(f"[WORKER] Processed and saved: {final_output_path}")
            segment_counter += 1

        except Exception as e:
            print(f"[WORKER ERROR] {e}")

if __name__ == "__main__":
    worker_loop()
