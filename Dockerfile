FROM node:18-alpine

WORKDIR /app-server

ENV NEXT_TELEMETRY_DISABLED=1 
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000 

CMD ["npm", "run", "dev"]