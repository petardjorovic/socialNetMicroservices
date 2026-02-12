# API Gateway

Purpose: central gateway that proxies requests to backend services (identity, post, media, search) and applies global middleware (rate limiting, helmet, logging).

- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Start (prod):** `npm run start`

- **Environment variables:**
  - `NODE_ENV` (default `development`)
  - `PORT` (default `3000`)
  - `IDENTITY_SERVICE_URL` (URL for Identity service)
  - `POST_SERVICE_URL` (URL for Post service)
  - `MEDIA_SERVICE_URL` (URL for Media service)
  - `SEARCH_SERVICE_URL` (URL for Search service)
  - `REDIS_URL` (Redis connection for rate-limiter)
  - `JWT_SECRET` (shared JWT secret)

- **Proxied routes:**
  - `/v1/auth` -> Identity service
  - `/v1/posts` -> Post service (requires auth)
  - `/v1/media` -> Media service (requires auth; supports file uploads)
  - `/v1/search` -> Search service (requires auth)

- **Notes:**
  - Uses `express-http-proxy` and a Redis-backed rate limiter.
  - `parseReqBody: false` for media proxy so file uploads stream correctly.
