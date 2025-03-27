Containers running on Kubernetes (error)

There is error with running server, mongo, web socket due to some sort of Image Pull error

----------------------------

Install wsl in windows terminal (cmd):

wsl --install

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
