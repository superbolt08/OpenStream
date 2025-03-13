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

### Running the Containers

To build and start all the services, run the following command in your project directory:


```bash
docker compose --env-file .env.dev up --build
