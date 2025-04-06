FROM python:3.10-slim

# System dependencies
RUN apt-get update && apt-get install -y build-essential gcc && rm -rf /var/lib/apt/lists/*
RUN python -m pip install --upgrade pip
# Set working directory
WORKDIR /app

# Copy and install Python packages
COPY requirements.txt .
RUN pip install -vv --no-cache-dir -r requirements.txt

# Copy your app
COPY inference_worker.py .

# Run the inference worker
CMD ["python", "inference_worker.py"]
