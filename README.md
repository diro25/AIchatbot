# Signal Room

A full-stack AI chat workspace built with React, Express, SQLite, and the Anthropic Messages API. It supports cookie-based accounts, persistent conversations, configurable system prompts, streamed responses, cancellation, and regeneration.

## Highlights

- Email/password registration and login with bcrypt and seven-day JWT cookie sessions
- Private, ownership-scoped conversations and message history
- Configurable system prompts and conversation titles
- Anthropic text responses streamed to the browser over Server-Sent Events
- Stop-generation cancellation through `AbortController`
- Assistant-response regeneration
- Chat, authentication, and general API rate limits
- Trusted-origin checks, Helmet, CORS allowlisting, and HTTP-only cookies
- Dark/light themes and responsive desktop/mobile layouts
- SQLite persistence with WAL mode and an isolated database query layer

## Architecture

```text
Browser (React + Vite)
        |
        | HTTP/JSON or SSE
        v
Express API
  |-- Authentication middleware
  |-- Zod request validation
  |-- Rate limiting and origin checks
  |-- Conversation controllers
  |-- Anthropic streaming service
        |
        v
better-sqlite3
        |
        v
SQLite (WAL)
```

In development, Vite serves the client on port `3000` and proxies `/api` to Express on port `3001`. In production, Express serves the built client and API from the same process and port.

### Repository layout

```text
client/src/
  api/                 # Browser API and SSE parsing
  components/          # Chat, sidebar, composer, and markdown UI
  context/             # Authentication and theme state
  hooks/               # Stream lifecycle and cancellation
  pages/               # Authentication and chat pages
server/src/
  controllers/         # HTTP request handlers
  db/                  # SQLite initialization and query functions
  middleware/          # Auth, validation, rate limits, security
  routes/              # Auth and conversation route definitions
  services/            # Anthropic provider integration
  utils/               # Error handling and history trimming
tests/                 # Node API integration tests
```

## Tech Stack

- React 19
- Vite 7
- React Router 7
- Tailwind CSS 3
- Express 5
- JSON Web Tokens
- bcrypt
- Zod
- better-sqlite3
- Anthropic SDK
- Server-Sent Events
- Node.js built-in test runner
- Supertest
- Docker

## Local Setup

### Prerequisites

- Node.js 20 or newer
- pnpm 10.12.1
- An Anthropic API key

### Install and configure

```bash
pnpm install
cp server/.env.example server/.env
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

Add these values to `server/.env`:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | For live chats | Empty | Anthropic API credential |
| `ANTHROPIC_MODEL` | For live chats | Empty | Anthropic model name |
| `JWT_SECRET` | Recommended; required in production | Development-only value | JWT signing secret; use at least 32 random characters |
| `DB_PATH` | No | `server/data/chatbot.db` | SQLite database file |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated origins allowed for CORS and mutations |
| `PUBLIC_ORIGIN` | No | Empty | Optional additional allowed origin |
| `COOKIE_SECURE` | No | `false` | Set to `true` for HTTPS; production requires this |
| `COOKIE_NAME` | No | `signal_room_session` | HTTP-only session cookie name |
| `MAX_HISTORY_MESSAGES` | No | `40` | Maximum conversation messages sent to Anthropic |
| `MAX_HISTORY_CHARACTERS` | No | `120000` | Maximum message text sent to Anthropic |
| `NODE_ENV` | No | `development` | Use `production` for deployment mode |
| `PORT` | No | `3001` locally, `3000` in production | Server port |

Never expose `ANTHROPIC_API_KEY` or `JWT_SECRET` through Vite or the client. Use a durable secret manager or deployment environment in production.

## API

All `/api/conversations` routes require the session cookie.

### Authentication

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ "email": "...", "password": "..." }` | Creates a user and session cookie |
| `POST` | `/api/auth/login` | `{ "email": "...", "password": "..." }` | Sets a session cookie |
| `POST` | `/api/auth/logout` | None | Clears the session cookie |
| `GET` | `/api/auth/me` | None | Returns the authenticated user |

### Conversations

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/api/conversations` | None | Lists owned conversations |
| `POST` | `/api/conversations` | `{ "title": "optional", "systemPrompt": "optional" }` | Creates a conversation |
| `PATCH` | `/api/conversations/:id` | `{ "title": "optional", "systemPrompt": "optional" }` | Updates a conversation |
| `DELETE` | `/api/conversations/:id` | None | Deletes a conversation and messages |
| `GET` | `/api/conversations/:id/messages` | None | Lists stored messages |
| `POST` | `/api/conversations/:id/chat` | `{ "message": "..." }` or `{ "regenerate": true }` | Streams a response with SSE |

The chat endpoint emits named SSE events:

```text
event: start
data: {"conversationId":1}

event: delta
data: {"text":"partial text"}

event: done
data: {"message":{...}}

event: error
data: {"code":"AI_ERROR","message":"..."}
```

## Streaming and Cancellation

The browser uses `fetch()` and a `ReadableStream` reader rather than `EventSource`, allowing a POST request and `AbortController` cancellation.

1. The server validates ownership and rejects concurrent generation for the same conversation.
2. It inserts the user message, sends an SSE `start` event, and initializes the Anthropic stream.
3. Each text delta is written as an SSE `delta` event.
4. The full provider response is inserted once, then sent as a `done` event.
5. Stopping the browser aborts its fetch request.
6. The request close handler aborts the Anthropic SDK stream and prevents partial text from being persisted.

Regeneration removes the previous assistant message and reuses the preceding user prompt. The provider can also be cancelled if the server or network connection closes unexpectedly.

## Commands

```bash
pnpm dev       # Run the Vite client and Express server
pnpm build     # Build the production client
pnpm start     # Run Express and the built client
pnpm test      # Run API integration tests
pnpm check     # Build the client and syntax-check the server
```

## Testing

Integration tests use a temporary SQLite database and Supertest. They cover health, registration, login failures, authentication, conversation CRUD, ownership, SSE provider errors, and regeneration validation.

```bash
pnpm test
```

Tests do not require an Anthropic API key. Live provider output is not mocked or verified end to end.

## Deployment

Build and run the included Docker image:

```bash
docker build -t signal-room .
docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET='replace-with-at-least-32-random-characters' \
  -e COOKIE_SECURE=true \
  -e ALLOWED_ORIGINS='https://your-client.example' \
  -e ANTHROPIC_API_KEY='your-server-key' \
  -e ANTHROPIC_MODEL='your-model-name' \
  -v signal-room-data:/app/server/data \
  signal-room
```

Configure the health check at `/healthz`. Mount a persistent volume at `/app/server/data` or set `DB_PATH` to persistent storage.

## SQLite to PostgreSQL Migration

SQLite is a good single-instance default because it requires no separate database service. It is not a suitable shared write store for multiple replicas.

For horizontal scaling:

1. Replace `better-sqlite3` initialization and SQL helpers in `server/src/db` with a PostgreSQL migration system and parameterized query layer.
2. Create a migration for `users`, `conversations`, and `messages`, including foreign keys and indexes.
3. Convert SQLite integer IDs and `AUTOINCREMENT` behavior to PostgreSQL `SERIAL` or `BIGSERIAL` IDs.
4. Convert timestamp defaults and date comparisons to PostgreSQL types.
5. Map `COLLATE NOCASE` email uniqueness to a case-normalized column or a case-insensitive uniqueness strategy.
6. Move the process-local `activeConversations` lock to PostgreSQL advisory locks or an external coordination layer such as Redis.
7. Replace WAL-specific operational assumptions with managed PostgreSQL backups and connection pooling.
8. Provide `DATABASE_URL` in deployment and keep `DB_PATH` as a SQLite-only development option.

The existing database module is isolated so migration can begin behind the exported query functions rather than rewriting controllers first.

## Known Limitations

- In-memory generation locking prevents duplicate responses only within one process; it does not coordinate multiple replicas.
- The SQLite database is designed for one persistent instance, not shared horizontal writes.
- Live Anthropic streaming is not covered by the automated integration suite.
- Partial response text is not persisted if a client cancels during generation.
- Password reset and email verification are not implemented.
- There is no message editing, search, file upload, or document retrieval.
- Rate-limit counters are process-local and reset when the server restarts.
- No request ID, structured log, provider usage, latency, or cost observability is included.
- The system has no organization or role model.
