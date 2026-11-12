# Signal Room — AI Chatbot

Signal Room is a production-oriented ChatGPT-style workspace with cookie-based auth, SQLite persistence, conversation management, configurable system prompts, and Anthropic streaming responses over Server-Sent Events.

## Architecture

The Vite React client runs on port 3000 in development and proxies `/api` to the Express server on port 3001. Express owns authentication, validation, rate limiting, SQLite access, and the Anthropic SDK. In production, the same Express process serves `client/dist` and the API on `PORT` (3000 by default). The database layer is isolated in `server/src/db` so it can later be replaced with PostgreSQL queries.

## Setup

Requirements: Node.js 20+, pnpm 10.12.1, and an Anthropic API key.

```bash
pnpm install
cp server/.env.example server/.env
# edit server/.env and set ANTHROPIC_API_KEY, ANTHROPIC_MODEL, and JWT_SECRET
pnpm dev
```

Open `http://localhost:3000`. For local HTTP, keep `COOKIE_SECURE=false`. For HTTPS Preview or a deployed HTTPS origin, set `COOKIE_SECURE=true`, set `PUBLIC_ORIGIN` when useful, and include the actual client origin in `ALLOWED_ORIGINS` when the API is hosted separately. State-changing requests enforce this trusted-origin list because sessions use cookies.

## Commands

```bash
pnpm dev       # Vite client + Express API with file watching
pnpm build     # production client build into client/dist
pnpm start     # production Express process
pnpm check     # Vite build plus server syntax check
```

## API surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/conversations`
- `POST /api/conversations`
- `PATCH /api/conversations/:id`
- `DELETE /api/conversations/:id`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/chat` — SSE events: `start`, `delta`, `done`, and `error`

## Verification checklist

1. Register a new account and confirm the session survives a page refresh.
2. Create two conversations, rename one, delete one, and confirm the list updates.
3. Edit a conversation system prompt and reload it.
4. Send a message with valid Anthropic credentials and confirm tokens stream into the assistant bubble.
5. Use Stop generating and confirm the request is cancelled without a partial assistant message being stored.
6. Use Regenerate on the last assistant message.
7. Refresh the page and confirm history is restored.
8. Toggle dark/light mode and confirm it persists.
9. Request `/healthz` and `/manus-routes.json` and confirm both return successful JSON.

## Deployment

### Render or Railway — one container

Build with the included `Dockerfile`. Set `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, a strong `JWT_SECRET` of at least 32 characters, `COOKIE_SECURE=true`, `ALLOWED_ORIGINS`, `NODE_ENV=production`, and a durable database strategy. Mount a persistent disk at `/app/server/data`; SQLite is suitable for a single persistent volume. For horizontally scaled instances, migrate the isolated query layer to PostgreSQL. Configure the health check path as `/healthz` and expose port 3000.

### Vercel or Netlify frontend

Build the client with `pnpm install && pnpm build` and publish `client/dist`. Set `VITE_API_BASE_URL` to the deployed API origin. On the API, set `ALLOWED_ORIGINS` to the deployed frontend origin, use `COOKIE_SECURE=true`, and configure a cookie-compatible HTTPS setup. A reverse proxy on one origin is recommended for the simplest cookie behavior.

## Next improvements

1. Add PostgreSQL migrations and a repository interface for multi-instance production.
2. Add file uploads and document retrieval with per-conversation context controls.
3. Add message editing, search, and keyboard shortcuts.
4. Add structured observability with request IDs, provider latency, and token usage.
5. Add optional organization workspaces with roles and shared conversations.
