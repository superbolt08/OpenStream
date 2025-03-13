FROM node:18-alpine

WORKDIR /server

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED 1 

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]