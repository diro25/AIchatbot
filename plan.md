# AI Chatbot Implementation Plan

## Scope and assumptions

- Build the requested full-stack app in `/home/ubuntu/chatbot`.
- Use a single Node.js process in development and production: Express serves `/api/*` and the built React client.
- Keep SQLite via `better-sqlite3` as requested; schema and data access are isolated so a PostgreSQL adapter can be added later.
- Use JWT stored in an httpOnly cookie. For public HTTPS Preview, the cookie uses `SameSite=None; Secure`; local HTTP uses separate plain-HTTP handling.
- Use the official Anthropic SDK with `ANTHROPIC_MODEL` read only on the server.
- The app is usable without an Anthropic key for auth/conversation flows; chat requests return a clear configuration error until the server key/model are configured.

## Design direction

Three style directions considered:

1. **Quiet command center** — restrained editorial dark UI with warm signal colors and compact utility controls. Probability: 0.07.
2. **Soft studio** — airy rounded panels, pastel accents, and friendly conversational spacing. Probability: 0.06.
3. **Terminal atelier** — high-contrast technical workspace with monospace-forward details and vivid status colors. Probability: 0.05.

Chosen: **Quiet command center**.

- **Design Movement:** Modern editorial software, influenced by high-end productivity tools and observability consoles.
- **Core Principles:** calm hierarchy, visible system state, low-friction actions, and content-first reading.
- **Color Philosophy:** deep ink and warm paper establish focus; an electric mint accent marks active state; amber is reserved for warnings and interruptions.
- **Layout Paradigm:** a persistent left command rail opens into a generous reading canvas, with the composer anchored as a tactile dock rather than a generic centered card.
- **Signature Elements:** mint status pulse, thin ruled separators, and small uppercase utility labels.
- **Interaction Philosophy:** every destructive or interruptive action is explicit; state changes are reflected immediately in the rail and composer.
- **Animation:** short 150–220ms opacity/translate transitions; streaming content appears naturally without distracting effects; loading uses a subtle three-dot pulse.
- **Typography System:** `Inter` for interface and body copy with `JetBrains Mono` for code, metadata, and technical labels. Strong title/label contrast and relaxed message line-height.
- **Brand Essence:** a focused AI workbench for people who want conversations to stay organized and legible; calm, precise, capable.
- **Brand Voice:** direct and quietly confident. Example lines: “Pick up where you left off.” and “Your next useful answer starts here.”
- **Wordmark & Logo:** a simple split-orbit mark: two offset rounded brackets around a mint center dot, suggesting context wrapping an active response.
- **Signature Brand Color:** signal mint `#9FE870`.

## Architecture

- `server/src/app.js`: Express bootstrap, security middleware, static serving, health endpoint.
- `server/src/db/`: SQLite connection, schema initialization, and query modules.
- `server/src/middleware/`: auth, validation/error handling, rate limits.
- `server/src/routes/`: auth, conversations, and streaming chat routes.
- `server/src/services/`: JWT helpers and Anthropic streaming adapter.
- `client/src/api/`: fetch wrapper and API methods.
- `client/src/context/`: auth and theme state.
- `client/src/hooks/`: conversation/message/chat hooks.
- `client/src/components/`: shell, sidebar, chat view, markdown/code block, dialogs, composer.
- `client/src/pages/`: login/register and chat workspace pages.

## Build workflow

1. Create package manifests and install dependencies.
2. Configure TypeScript/JS diagnostics before implementation.
3. Implement database schema and backend routes first, including SSE event contract.
4. Implement auth/theme contexts and responsive client shell.
5. Add markdown/code rendering, streaming cancellation, regenerate, and system prompt controls.
6. Add route manifest, env examples, README, Dockerfile, and deployment configuration.
7. Run lint/build/type checks and focused API smoke checks without mutating shared production data beyond an isolated local SQLite file.
8. Start the preview server, verify health and route-manifest endpoints, and checkpoint the finished project.
