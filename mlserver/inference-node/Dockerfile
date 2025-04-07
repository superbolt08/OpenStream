FROM python:3.10-slim

# Install system dependencies for pip + OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python -m pip install --upgrade pip

# Set working directory
WORKDIR /app

# Copy and install Python packages
COPY requirements.txt .
RUN pip install numpy==1.26.4 scipy==1.11.4
#RUN pip install ultralytics==8.0.20
RUN pip install -vv --no-cache-dir -r requirements.txt

# Copy your app
COPY inference_worker.py .

# Run the inference worker
CMD ["python", "inference_worker.py"]
