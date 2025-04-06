# test_sender.py
import zmq
import time

context = zmq.Context()
socket = context.socket(zmq.PUSH)
socket.connect("tcp://localhost:5555")  # Make sure this matches your inference worker's socket

message = {
    "segment_id": "test123",
    "video_segment_path": "/data/test_video.mp4"  # Must match what the container can access
}

print("[SENDER] Sending test segment")
socket.send_json(message)
time.sleep(1)  # give it a second to send
print("[SENDER] Done")
