import zmq
import struct
import cv2
import torch
import numpy as np
import tempfile
import time
import os
from VideoQ import video_queue
import subprocess

# Load YOLOv5
model = torch.hub.load('ultralytics/yolov5', 'yolov5n', pretrained=True)
model.eval()

# ZMQ socket for receiving raw segments
context = zmq.Context()
recv_socket = context.socket(zmq.PULL)
recv_socket.bind("tcp://*:6000")  # From master


##You should probably change this for the database.
SEGMENT_SAVE_DIR = tempfile.gettempdir()
segment_counter = 0

print("Worker ready to process and queue segments for streaming...")

while True:
    try:
        # Receive segment
        size_data = recv_socket.recv(4)
        size = struct.unpack(">L", size_data)[0]
        segment_data = recv_socket.recv(size)

        # Save to temp file
        segment_path = os.path.join(SEGMENT_SAVE_DIR, f"segment_in.mp4")
        with open(segment_path, 'wb') as f:
            f.write(segment_data)

        # Process the video segment with YOLO
        cap = cv2.VideoCapture(segment_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
##Saves the segment at a .mp4 file
        output_path = os.path.join(SEGMENT_SAVE_DIR, f"segment_{segment_counter:03}.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
## for debugging Purposes displays processed frames
        # while cap.isOpened():
        #     ret, frame = cap.read()
        #     if not ret:
        #         break
        #     results = model(frame)
        #     annotated = results.render()[0]
        #     out.write(annotated)

        # cap.release()
        # out.release()

        # Extract audio from original segment
        audio_path = os.path.join(SEGMENT_SAVE_DIR, f"audio_{segment_counter:03}.aac")
        ffmpeg_audio_cmd = [
            "ffmpeg", "-y",
            "-i", segment_path,
            "-vn",  # no video
            "-acodec", "copy",
            audio_path
        ]
        subprocess.run(ffmpeg_audio_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        #Combine annotated video and original audio
        final_output_path = os.path.join(SEGMENT_SAVE_DIR, f"segment_{segment_counter:03}_final.mp4")
        ffmpeg_mux_cmd = [
            "ffmpeg", "-y",
            "-i", output_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            final_output_path
        ]
        subprocess.run(ffmpeg_mux_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        #Send final processed segment to VideoQ
        with open(final_output_path, 'rb') as f:
            processed_data = f.read()
        video_queue.put((segment_counter, processed_data))
        print(f" Queued processed segment {segment_counter} with audio for streaming.")

        # Cleanup
        segment_counter += 1
        os.remove(segment_path)
        os.remove(output_path)
        os.remove(audio_path)
        #os.remove(final_output_path)

    except Exception as e:
        print(f"Error in worker: {e}")
