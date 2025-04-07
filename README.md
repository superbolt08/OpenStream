# PiEdge Cloud: OpenStream

A cloud-based real-time video streaming and distributed computing platform built on a scalable Raspberry Pi cluster. This project is developed for CMPE 246 at UBC Okanagan and integrates edge computing, machine learning, and web development technologies.


<img src="images/PiStack1.jpeg" alt="Pi Stack" width="50%" />

## 📦 Project Structure
![System UML](images/System%20UML.png)


## 🧠 Core Features

- **Raspberry Pi Cluster (3 Nodes)**  
  - Master node runs Kubernetes (K3s) for container orchestration
  - High-speed Gigabit networking for distributed communication

- **Wireless Video Capture & Processing**  
  - A Pi with Camera Module 3 streams video to the cluster
  - Real-time ML tasks: face/object detection using TensorFlow

- **Web Streaming Application**  
  - Built with Next.js (React + TypeScript) and Node.js backend
  - Live video feed and event-based messaging overlay

- **Database Integration**  
  - Prisma ORM with MongoDB for real-time and persistent data
  - Scalable design for future multi-user features

- **Design Patterns Used**  
  - Singleton (master node), Factory (node scaling), Strategy (ML models), Observer (stream updates), MVC (web app), Adapter (protocols)

## 🚀 Getting Started

### Prerequisites

- Raspberry Pi 4 (x8 recommended)
- Camera Module 3 (1 unit)
- Gigabit Ethernet switch
- NVMe SSD (optional for master node)
- Docker & Kubernetes (K3s)
- Node.js + Yarn/NPM
- WSL
- Docker Desktop

### Setup Steps
1. **Install WSL**

Open CMD and run:
```bash
wsl --install
```

2. **Cluster Configuration**
```bash
cd cluster/scripts/
./setup-k3s-master.sh
./setup-k3s-worker.sh
```
3. **Deploy ML and Video Modules**
```
cd ml/streaming/
python3 run_stream.py
```
4. **Run Web App Locally**
```
cd ml/streaming/
python3 run_stream.py
```
5. **Deploy via Kubernetes**
```
cd ml/streaming/
python3 run_stream.py
```


## 📊 Architecture

- **Cluster**: Raspberry Pi 4 nodes connected via a switch, using K3s  
- **Streaming**: RTSP or WebRTC feeds processed in parallel  
- **Web App**: User-friendly interface with dynamic video and event overlays  
- **ML Tasks**: TensorFlow models for object recognition, adaptable with Strategy pattern  


---

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript  
- **Backend**: Node.js, Express  
- **ML**: TensorFlow, Python  
- **Database**: Prisma, MongoDB  
- **Containerization**: Docker, Kubernetes (K3s)  

---

## 📚 References

- [Kubernetes Docs](https://kubernetes.io/)  
- [TensorFlow](https://www.tensorflow.org/)  
- [Raspberry Pi Clustering Tutorial](https://www.raspberrypi.com/tutorials/cluster-raspberry-pi-tutorial/)  
- [Docker Swarm Setup](https://docs.docker.com/engine/swarm/)  

---

## 📄 License

This project is developed as part of a university course and is not licensed for commercial distribution.

---

📷 Powered by Raspberry Pi  
⚡ Fueled by curiosity and collaboration

----------------------------

*Miscellaneous*

Install wsl in windows terminal (cmd):

wsl --install

----------------------------

Make sure Docker Desktop is open for next steps

----------------------------

Install k3s on wsl Ubuntu (launch cmd and go to top right v sign to select Ubuntu):

curl -sfL https://get.k3s.io | sh -

----------------------------

Start k3s:

sudo systemctl start k3s

sudo chmod 644 /etc/rancher/k3s/k3s.yaml

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

----------------------------

Naviagate to local repo in wsl:

cd /mnt

cd c

cd [naviagate as needed]

----------------------------

To Run:

kubectl apply -f .

Check pod status:

kubectl get pods -o wide

Restart:

kubectl delete --all services

kubectl delete --all pods

kubectl delete --all deployments

----------------------------

Debugging:

kubectl describe pod

kubectl get svc

kubectl logs

kubectl exec -it <pod-name> -- /bin/sh
