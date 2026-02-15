# Identity Service

Purpose: handles user registration, authentication (JWT), and user storage (MongoDB).

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

- **Environment variables:** Create a `.env` file (or `.env.prod` for Docker Compose) based on `.env.example`:
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3001`)
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (JWT signing secret)
  - `REDIS_URL` (Redis connection for rate limiting)

- **Setup:** Copy `.env.example` to `.env` and update with your configuration values.

- **Routes:**
  - `/api/auth` — authentication endpoints (register, login, refresh token, etc.)

- **Notes:**
  - Connects to MongoDB on start and uses Redis for rate limiting.
  - Sensitive endpoints have additional rate limiting applied.
