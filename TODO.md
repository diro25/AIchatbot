# Delivery checklist

## Authentication and sessions

- [x] Users can register with a validated email and password, with passwords hashed using bcrypt.
- [x] Users can log in, log out, and retrieve the current session through `/api/auth/me`.
- [x] JWT sessions are stored in an httpOnly cookie; public HTTPS Preview uses `SameSite=None; Secure`, while local HTTP can use a separate non-secure setting.
- [x] Protected routes reject missing or invalid sessions and never expose the Anthropic API key to the browser.

## Conversations and persistence

- [x] Users can list, create, rename, and delete only their own conversations.
- [x] Each conversation supports a configurable system prompt.
- [x] Messages are persisted with the requested users, conversations, and messages schema, and conversation history is restored on reload.
- [x] SQL statements are parameterized and old history is bounded before being sent to the AI.

## Streaming chat experience

- [x] `POST /api/conversations/:id/chat` saves the user message and streams the assistant reply over Server-Sent Events.
- [x] The UI renders user and assistant bubbles, Markdown, syntax-highlighted code blocks, and a copy button for code.
- [x] The UI supports auto-scroll, loading state, stop generating, and regenerate last response.
- [x] Empty messages, oversized messages, missing configuration, provider errors, and rate-limit errors have clear user-facing handling.

## Responsive product experience

- [x] The workspace is mobile-first and usable at narrow and desktop widths.
- [x] Dark and light themes persist locally and expose a clear toggle.
- [x] Sidebar, chat header, composer, and system-prompt controls are visually coherent with the approved quiet command center direction.
- [x] `/manus-routes.json` describes all page routes and is served as static JSON.

## Delivery and operations

- [x] Client and server environment examples document the required Anthropic model/key, JWT secret, cookie mode, origin, and database path.
- [x] The project has reproducible install, development, build, start, and check commands.
- [x] A production Dockerfile serves the built client and API from a single container and exposes an unauthenticated health endpoint.
- [x] Preview readiness, route manifest, production build, and core backend syntax are verified before checkpointing.

## Validation note

Auth, session persistence, conversation creation, trusted-origin checks, SSE framing, route manifest serving, health, production HTML serving, and clean builds were smoke-tested. Live Anthropic token deltas require the operator to provide `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` in `server/.env` or the deployment environment.
