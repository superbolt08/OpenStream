# How does this work?
- The machine learning segement of our project is relegated to 3 nodes each a specific task.
## What do each of them do?
### Fetcher
- This node is responsible to detect when someone begins a stream and starts to record their camera to be sent to the inference worker.
### Inference Worker
- This node is responsible to run the machine learning model (YOLOV5n) to do facial and object detection,
### Visualizer 
- This node (likely the weakest) is responsible for grabbing the segements and displaying them onto the website.

# How does the stuff run?
- In this segment we utilized docker to host 4 different containers to allow each node to work independantly from eachother. Where the database is located within the master node (The one with the SSD).
- Each segement has their own dockerfile and is ran by one docker-compose file. Where each service is connected via a socket for communication.
- To fully run it we need to preform a command docker compose up, then if we want to change anything we use: docker compose down then up again.

# How to start the process without front end?
### Note: Make sure you have postman and docker installed or this will not work.