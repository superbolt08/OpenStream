# Task Manager Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). The application is containerized using Docker and Docker Compose. The stack includes:

- **Server:** The Next.js app (with Prisma for database migrations and seeding)
- **Database:** A MongoDB container (using the official mongo image)
- **Mongo Express:** A web-based MongoDB admin interface

> **Note:** This project uses a custom environment file (`.env.dev`) for configuration.

- See .example.env.dev for example 

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

## Getting Started

## Set Up
1. Run `npm i` to install packages. May need `sudo` if on WSL

### Running the Containers

1. Make sure you have docker installed and open on your computer
2. Navigate to the project folder
3. Fill out the *.env.dev* file from the *.example.env.dev* file (no need to add username and password)

To build and start all the services, run the following command in your project directory:

```bash
npm run app:start  # Starts the container
npm run app:build  # Builds the container
npm run app:stop   # Stops the container

# The above commands are part of our Task Manager Application workflow.
# app:build builds the container, app:start just starts the container (already built), and app:stop stops the container.

````

## Prisma: Updating Models
1. Once the docker container is started, enter the shell with `docker exec -it open_stream sh`
1. Run `npm run prisma:generate` to get generate the prisma client
2. Run `npm run db:push` to get your schema into the database

