import requests
from queue import PriorityQueue
import threading
import tempfile
import os

video_queue = PriorityQueue()

#So esscnetially when the files are sent here it get's sorted into a priority queue then when it gets sent to the website's 
#stream it deletes the file.

# Local API endpoint change if needed ngl obvs its not this API URL
UPLOAD_API_URL = "http://localhost:5000/api/upload_segment"

def video_consumer():
    while True:
        segment_id, video_data = video_queue.get()
        print(f"Sending segment #{segment_id} to local database")

        # Save segment to temp file
        segment_path = os.path.join(tempfile.gettempdir(), f"segment_{segment_id:03}.mp4")
        with open(segment_path, 'wb') as f:
            f.write(video_data)

        try:
            # Upload to local database via HTTP POST
            with open(segment_path, 'rb') as f:
                files = {'file': (f"segment_{segment_id:03}.mp4", f, 'video/mp4')}
                response = requests.post(UPLOAD_API_URL, files=files)

            if response.status_code == 200:
                print(f"Segment {segment_id} uploaded.")
            else:
                print(f"Upload failed for segment {segment_id} — Status: {response.status_code}")

        except Exception as e:
            print(f"Error uploading segment {segment_id}: {e}")

        # Cleanup
        os.remove(segment_path)
        video_queue.task_done()

# Start the background consumer thread
threading.Thread(target=video_consumer, daemon=True).start()
