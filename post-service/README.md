# Post Service

Purpose: handles creating, updating, deleting and fetching posts; publishes/consumes events via RabbitMQ.

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

- **Environment variables:** Create a `.env` file (or `.env.prod` for Docker Compose) based on `.env.example`:
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3002`)
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (JWT secret)
  - `REDIS_URL` (Redis connection)
  - `RABBITMQ_URL` (RabbitMQ connection string)

- **Setup:** Copy `.env.example` to `.env` and update with your configuration values.

- **Routes:**
  - `/api/posts` — endpoints for post CRUD and related operations

- **Notes:**
  - Connects to MongoDB and RabbitMQ on startup.
  - Emits events for downstream services when posts change.
