# Search Service

Purpose: provides search capabilities for posts; keeps search index updated via RabbitMQ events.

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

- **Environment variables:** Create a `.env` file (or `.env.prod` for Docker Compose) based on `.env.example`:
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3004`)
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (JWT secret)
  - `REDIS_URL` (Redis connection)
  - `RABBITMQ_URL` (RabbitMQ connection string)

- **Setup:** Copy `.env.example` to `.env` and update with your configuration values.

- **Routes:**
  - `/api/search` — search endpoints for posts

- **Notes:**
  - Connects to RabbitMQ, MongoDB and registers consumers to keep the search index in sync.
