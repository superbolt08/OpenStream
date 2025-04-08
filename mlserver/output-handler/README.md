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
- __If this is your first time__: In bash type: docker compose up --build this will construct the containers (Note: It will take a significant amount of time to build.)
- In bash terminal type: docker compose up and wait until each container is online and the model is loaded
    - Get a stream link from the website
    - In postman use the drop down button to put the link into the database and record it's id.
        - node the link is called: http://localhost:8000/add_stream
        - select body from the menu and select json as the format.
        - in the body type the following command and replace whatever is needed:
        {
            "url":"Your Stream URL goes here"
            "name":"Your Stream name goes here"
        }
        - This will return the name and the id used to start to process
    - In postman create a new tab and use the drop down to select post again, using the text box type: http://localhost:8000/start
    - In the same menu as before with the json format you want to put the id from the database so the inference worker knows what to start with
    {
        "id":"id you got from postman"
    }
    - This will return a string that says "Stream successfully started!"
- inference_worker.py will work asychronously with the other files to create output
- if you want to view output it is located within /app/segments within the inference container on docker
- to test if you have segments type in the link http://localhost:8080/segments into postman using get, this will list an array of elements named segement_XXX_yolo.mp4. This segement is a four second clip that is processed and rendered with the box drawn.