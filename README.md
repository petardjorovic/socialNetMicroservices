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

**Environment variables (examples)**
Create a `.env` file in each service folder. Minimal examples:

- `api-gateway/.env`

```
NODE_ENV=development
PORT=3000
IDENTITY_SERVICE_URL=http://localhost:3001
POST_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3004
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

- `identity-service/.env`

```
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/identity
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

- `post-service/.env`

```
NODE_ENV=development
PORT=3002
MONGO_URI=mongodb://localhost:27017/posts
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
```

- `media-service/.env`

```
NODE_ENV=development
PORT=3003
MONGO_URI=mongodb://localhost:27017/media
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RABBITMQ_URL=amqp://localhost
```

- `search-service/.env`

```
NODE_ENV=development
PORT=3004
MONGO_URI=mongodb://localhost:27017/search
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
```

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
