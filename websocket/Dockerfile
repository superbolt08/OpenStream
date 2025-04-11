FROM node:18-alpine

WORKDIR /websocket

RUN apk add --no-cache curl

ENV NEXT_TELEMETRY_DISABLED=1 
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

COPY package*.json ./

RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
