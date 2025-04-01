import requests

API_URL = "http://db-api-service:5000/stream-url"  # Cluster service change if needed

def get_stream_url():
    try:
        res = requests.get(API_URL)
        res.raise_for_status()
        return res.json()["url"]
    except Exception as e:
        print("Failed to fetch stream URL:", e)
        return None

def set_url():
    stream_url  = get_stream_url()
    return stream_url

