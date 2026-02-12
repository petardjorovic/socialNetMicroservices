# Media Service

Purpose: manages media uploads, storage (Cloudinary), and media-related events (RabbitMQ consumers/producers).

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

- **Environment variables:**
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3003`)
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (JWT secret)
  - `REDIS_URL` (Redis connection)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary credentials)
  - `CLOUDINARY_URL` (optional full Cloudinary URL)
  - `RABBITMQ_URL` (RabbitMQ connection string)

- **Routes:**
  - `/api/media` — media upload/download endpoints

- **Notes:**
  - Connects to RabbitMQ and registers consumers on startup.
  - Uses `multer` for handling multipart uploads and uploads to Cloudinary.
