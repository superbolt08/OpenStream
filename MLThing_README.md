# How Does This Work?

The machine learning segment of our project is split into **three nodes**, each with a specific task:

## Node Responsibilities

### Fetcher
- Detects when a user starts a stream.
- Begins recording the user's camera and sends data to the inference worker.

### Inference Worker
- Runs the YOLOv5n model for **facial and object detection**.

### Visualizer
- Grabs processed video segments and displays them on the website (lightweight node).

---

# How Is It Run?

We use **Docker** to host four containers, allowing each node to run independently.  
- The **database** is located within the **master node** (with the SSD).
- Each segment has its own `Dockerfile`.
- They are all run through one `docker-compose.yml` file.
- Communication happens via **ZeroMQ sockets**.

### Starting the system:

```bash
# Initial build
docker compose up --build

# After changes
docker compose down
docker compose up
```

---

# How to Start Without a Frontend

Make sure you have **Docker** and **Postman** installed.

### 1. Build & Launch Containers
__IMPORTANT NAVIGATE TO ML-SERVER FILE BEFORE STARTING UP__
```bash
docker compose up --build
```

This may take some time on first run.

Once built:

```bash
docker compose up
```

### 2. Add a Stream URL (via Postman)

- POST `http://localhost:8000/add_stream`
- Set body → raw → JSON:

```json
{
  "url": "Your Stream URL goes here",
  "name": "Your Stream name goes here"
}
```

- You'll get back a stream ID.

### 3. Start the Stream

- POST `http://localhost:8000/start`
- Set body → raw → JSON:

```json
{
  "id": "ID you got from Postman"
}
```

- Response: `"Stream successfully started!"`

### 4. Segment Output Location

- Segments are saved in: `/app/segments` inside the **inference container**

To test output:
- GET `http://localhost:8080/segments` 
  Returns something like:

```json
["segment_001_yolo.mp4", "segment_002_yolo.mp4", ...]
```

---

## Other Functions

### FastAPI Healthcheck & Controls
- Healthcheck: GET `http://localhost:8000/`
- Stop a stream: GET `http://localhost:8000/stop/{stream_id}`
- Webcam test (legacy): GET `http://localhost/test/webcam`

### Visualizer Endpoints
- Test port: GET `http://localhost:8080/test`
- List segments: GET `http://localhost:8080/segments`
- Read segment file: GET `http://localhost:8080/segments/{filename}`
