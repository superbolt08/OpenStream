FROM python:3.10-slim

# Set working directory
WORKDIR /app

# System dependencies (optional but helpful for many libs)
RUN apt-get update && \
    apt-get install -y gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the visualizer app into the container
COPY visualizer.py .

# Ensure "visualizer.py" has an app instance called "app"
# Start the FastAPI visualizer server
CMD ["uvicorn", "visualizer:app", "--host", "0.0.0.0", "--port", "8080"]
