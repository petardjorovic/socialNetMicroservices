# socialNetMicroservices

Purpose: A small microservices-based social network prototype. It provides user identity, post management, media handling, and search functionality behind an API Gateway.

**Services**

- **api-gateway**: central reverse-proxy and entrypoint. Routes to identity, post, media and search services; provides global middleware (security headers, rate limiting, request logging).
- **identity-service**: user registration, authentication (JWT), and refresh-token management. Uses MongoDB and Redis for rate limiting.
- **post-service**: CRUD for posts; publishes events for other services via RabbitMQ; uses MongoDB.
- **media-service**: handles file uploads, stores media in Cloudinary, consumes/publishes events via RabbitMQ.
- **search-service**: maintains a search index for posts and exposes search endpoints; syncs via RabbitMQ events.

**Quick Start (per-service)**

- Install dependencies in each service folder:

```bash
cd api-gateway && npm install
cd ../identity-service && npm install
cd ../post-service && npm install
cd ../media-service && npm install
cd ../search-service && npm install
```

- Run a service in development mode (example):

```bash
cd identity-service
npm run dev
```

Each service supports `npm run dev` (uses `tsx watch`), `npm run build` (TypeScript compile) and `npm run start` for production.

**Docker Compose Setup**

To run all services and their dependencies (MongoDB, Redis, RabbitMQ) using Docker Compose:

1. Set up environment files for Docker. Create `.env.prod` files in each service folder based on `.env.example`:

```bash
cd api-gateway && cp .env.example .env.prod && cd ..
cd identity-service && cp .env.example .env.prod && cd ..
cd post-service && cp .env.example .env.prod && cd ..
cd media-service && cp .env.example .env.prod && cd ..
cd search-service && cp .env.example .env.prod && cd ..
```

2. Update the `.env.prod` files with appropriate configuration values (e.g., service names should reference the Docker container names like `mongodb`, `redis`, `rabbitmq`).

3. Build and start all services:

```bash
docker-compose up -d
```

This will:

- Build Docker images for all microservices
- Start MongoDB, Redis, and RabbitMQ containers
- Start all microservice containers
- Set up networking and health checks

To view logs:

```bash
docker-compose logs -f
```

To stop services:

```bash
docker-compose down
```

**Environment variables**

Each service provides a `.env.example` file as a template. Copy it to create your own configuration file:

- **For development (local setup):** Create a `.env` file in each service folder based on `.env.example`
- **For production (Docker Compose):** Create a `.env.prod` file in each service folder based on `.env.example`

Example setup for development:

```bash
cd api-gateway && cp .env.example .env && cd ..
cd identity-service && cp .env.example .env && cd ..
cd post-service && cp .env.example .env && cd ..
cd media-service && cp .env.example .env && cd ..
cd search-service && cp .env.example .env && cd ..
```

Update each `.env` file with your local configuration values (e.g., `localhost` URLs, `mongodb://localhost:27017`, etc.).

**Ports & URLs**

- Default ports (adjust in `.env`): API Gateway `3000`, Identity `3001`, Post `3002`, Media `3003`, Search `3004`.
- The API Gateway proxies under `/v1/*` to service `/api/*` endpoints — check `api-gateway/src/server.ts` for details.

**Logging & Observability**

- Services use `winston` for logging; request logging is implemented in each `src/server.ts`.
- Rate limiting uses Redis-backed stores; ensure `REDIS_URL` is reachable in development.

**Notes & Troubleshooting**

- Ensure MongoDB, Redis and RabbitMQ are running before starting services that depend on them.
- If ports collide, update `PORT` values in the respective `.env` files and the `IDENTITY_SERVICE_URL` / `POST_SERVICE_URL` etc. in the API Gateway.
- Media uploads stream through the gateway. The gateway sets `parseReqBody: false` to preserve file upload streams.

**Useful links**

- Service READMEs:
  - [api-gateway/README.md](api-gateway/README.md)
  - [identity-service/README.md](identity-service/README.md)
  - [post-service/README.md](post-service/README.md)
  - [media-service/README.md](media-service/README.md)
  - [search-service/README.md](search-service/README.md)
