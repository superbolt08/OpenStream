FROM python:3.10-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /worker

# Copy code
COPY . .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Run worker on container start
CMD ["python", "main.py"]
