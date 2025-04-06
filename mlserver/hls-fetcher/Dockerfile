FROM python:3.10-slim

# Install ffmpeg and system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg gcc && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY requirements.txt /app/requirements.txt
WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI app
COPY fetcher.py /app/fetcher.py

# Run the FastAPI server
CMD ["uvicorn", "fetcher:app", "--host", "0.0.0.0", "--port", "8000"]
