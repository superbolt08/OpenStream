FROM node:18-alpine

WORKDIR /server

ENV NEXT_TELEMETRY_DISABLED 1 
ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000 
# Alternatively you could use 3001

RUN echo $NODE_ENV
CMD ["npm", "run", "dev"]