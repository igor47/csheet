
# CSheet Project Guidelines

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## Framework

This project uses **Hono** as the web framework with JSX rendering.

- We use `hono/jsx-renderer` for server-side rendering
- All routes use `c.render()` to render components with the Layout
- Bootstrap 5 is used for styling (via CDN in Layout)

## Project Structure

```
src/
├── app.ts              # Main app entry point, registers routes and middleware
├── components/         # React/JSX components
│   ├── Layout.tsx      # Main layout wrapper with Navbar
│   ├── Welcome.tsx     # Home page component
│   ├── Character.tsx   # Character sheet component
│   ├── CharacterNew.tsx # Character creation component
│   ├── Login.tsx       # Login page component
│   └── ui/
│       └── Navbar.tsx  # Navigation bar with auth status
├── routes/             # Route handlers
│   ├── index.tsx       # Home route (/)
│   ├── auth.tsx        # Auth routes (/login, /logout)
│   └── character.tsx   # Character routes (/character/new, /character/view)
├── middleware/         # Middleware
│   └── auth.ts         # Auth middleware (sets c.var.user)
├── db/                 # Database layer
│   └── users.ts        # User model and queries
└── config.ts           # Configuration
```

## Routes

Routes are defined in `src/routes/` and registered in `src/app.ts`:

```tsx
// src/routes/index.tsx
export const indexRoutes = new Hono()

indexRoutes.get('/', (c) => {
  return c.render(<Welcome user={c.var.user} />, { title: "Welcome to CSheet" })
})
```

Register routes in `src/app.ts`:

```tsx
app.route('/', indexRoutes)
app.route('/', authRoutes)
app.route('/character', characterRoutes)
```

## Components

Components live in `src/components/` and should:

- Use Bootstrap 5 classes for styling
- Define a TypeScript interface for props (e.g., `WelcomeProps`, `LayoutProps`)
- Break complex UI into sub-components within the same file
- Accept `user?: User` prop when auth state is needed

Example:

```tsx
import type { User } from "@src/db/users";

export interface WelcomeProps {
  user?: User;
}

export const Welcome = ({ user }: WelcomeProps) => (
  <div class="container">
    {/* ... */}
  </div>
)
```

## Layout & Rendering

The Layout component (`src/components/Layout.tsx`) wraps all pages:

- Automatically receives `user` from auth middleware via renderer
- Automatically receives `currentPage` from `c.req.path`
- Passes these props to Navbar for auth UI and active link highlighting

```tsx
// In src/app.ts
app.use(jsxRenderer((props, c) => {
  const user = c.get('user')
  const currentPage = c.req.path
  return Layout({ ...props, user, currentPage })
}))
```

Routes just need to call `c.render()`:

```tsx
c.render(<Component />, { title: "Page Title" })
```

## Authentication

Authentication is handled via signed cookies:

- Middleware: `src/middleware/auth.ts` sets `c.var.user` if authenticated
- Access user in routes: `c.var.user`
- Auth functions: `setAuthCookie(c, userId)`, `clearAuthCookie(c)`
- Login: `/login` (GET shows form, POST authenticates)
- Logout: `/logout` (GET logs out and redirects to home)

The auth middleware runs on all routes (`app.use('*', authMiddleware)`).

## Navbar

The Navbar (`src/components/ui/Navbar.tsx`):

- Shows username (from email) and logout button when logged in
- Shows login button when logged out
- Highlights active page based on `currentPage` prop
- Uses `getNavLinks()` function to generate nav items with `isActive` flag

## Database

This project uses **PostgreSQL 16** running in Docker.

### Setup

1. Start dependencies: `mise run deps:up`
2. Run migrations: `mise run db:upgrade`
3. Start dev server: `mise run app:dev` (automatically starts dependencies)

### Environment Variables

Configure PostgreSQL connection in `.env` (optional, defaults provided):

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=csheet_user
POSTGRES_PASSWORD=csheet_pass
POSTGRES_DB=csheet_dev
```

### Database Tasks

- `mise run deps:up` - Start all Docker services (PostgreSQL and MinIO)
- `mise run deps:down` - Stop all Docker services
- `mise run db:upgrade` - Run migrations (common task)
- `mise run dbmate <command>` - Run specific dbmate commands (new, rollback, status, dump, etc.)
- `mise run db:psql` - Open PostgreSQL shell
- `mise run db:logs` - View PostgreSQL container logs

### Migrations

- Migrations are in `migrations/` directory
- Managed by [dbmate](https://github.com/amacneil/dbmate)
- Schema file auto-generated at `db/schema.sql`
- Create new migration: `mise run dbmate new migration_name`

### Database Layer

- Using `Bun.sql` (native PostgreSQL client)
- Models defined in `src/db/` (e.g., `users.ts`, `characters.ts`)
- All models export functions like `findById`, `findByEmail`, `create`, etc.
- Database instance exported from `src/db.ts`

## APIs

- `Bun.sql` for PostgreSQL (native client). Don't use `pg` or `postgres.js`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Code Quality

This project uses **Biome** for linting and formatting:

```bash
# Run checks (linting, formatting, and TypeScript)
mise run check

# Auto-fix linting and formatting issues
mise run check-fix
```

Biome is configured in `biome.json` and runs automatically on save in most editors.

## Testing

Use **Bun's built-in test runner** for all tests. Run via `mise run test` to ensure the test database is properly configured.

```bash
# Run all tests
mise run test

# Run specific test file
mise run test src/routes/character.test.ts

# Run tests matching a pattern
mise run test --test-name-pattern "when user is authenticated"
```

### Test Philosophy

- Write **integration tests**, not unit tests
- Test through HTTP requests to the full application stack
- Use **RSpec-style nested describe blocks** with fixtures
- Each test should be readable as a specification

### Test Infrastructure

#### useTestApp()

The `useTestApp()` helper (from `@src/test/app`) sets up test isolation:

```typescript
import { useTestApp } from "@src/test/app"

describe("GET /characters", () => {
  const testCtx = useTestApp()  // Don't destructure!

  test("example", async () => {
    // Access via testCtx.app and testCtx.db
    const response = await makeRequest(testCtx.app, "/path")
  })
})
```

**How it works:**
- Creates a fresh app instance for each test
- Reserves a database connection and starts a transaction with `BEGIN`
- Injects the test database into the app via `createApp(db)`
- Automatically rolls back the transaction after each test
- Ensures clean database state between tests

**Important:** Use `const testCtx = useTestApp()` and access via `testCtx.app` / `testCtx.db`. Don't destructure `const { app, db } = useTestApp()` as values are set in `beforeEach`.

#### Database Fixtures with Factories

Use [fishery](https://github.com/thoughtbot/fishery) factories to create test data:

```typescript
import { userFactory } from "@src/test/factories/user"
import { characterFactory } from "@src/test/factories/character"

describe("with a character", () => {
  let user: User
  let character: Character

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create(
      { user_id: user.id, name: "Custom Name" },
      testCtx.db
    )
  })

  test("displays the character", async () => {
    // character is available in this scope
  })
})
```

Factories live in `src/test/factories/` and use [@faker-js/faker](https://fakerjs.dev/) for realistic data.

#### HTTP Test Helpers

Use helpers from `@src/test/http` for making requests and parsing responses:

```typescript
import { makeRequest, parseHtml, expectElement } from "@src/test/http"

test("renders login page", async () => {
  // Make request (optionally with authenticated user)
  const response = await makeRequest(testCtx.app, "/login", { user })

  // Parse HTML response
  const document = await parseHtml(response)

  // Assert elements exist
  const title = expectElement(document, "title")
  expect(title.textContent).toContain("Login")
})
```

**makeRequest options:**
- `user?: User` - Automatically creates signed auth cookie
- `method?: string` - HTTP method (default: GET)
- `headers?: Record<string, string>` - Custom headers
- `body?: string | FormData` - Request body
- `cookies?: string[]` - Additional cookies

**HTML helpers:**
- `parseHtml(response)` - Parse response into DOM Document
- `expectElement(document, selector)` - Assert element exists and return it
- `getElementText(document, selector)` - Get element text content
- `elementExists(document, selector)` - Check if element exists
- `getElements(document, selector)` - Get all matching elements

### Test Structure Example

```typescript
import { describe, test, expect, beforeEach } from "bun:test"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { characterFactory } from "@src/test/factories/character"
import { makeRequest, parseHtml, expectElement } from "@src/test/http"
import type { User } from "@src/db/users"
import type { Character } from "@src/db/characters"

describe("GET /characters", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with no characters", () => {
      test("redirects to /characters/new", async () => {
        const response = await makeRequest(testCtx.app, "/characters", { user })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters/new")
      })
    })

    describe("with a character", () => {
      let character: Character

      beforeEach(async () => {
        character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      })

      test("displays the character name", async () => {
        const response = await makeRequest(testCtx.app, "/characters", { user })
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(character.name)
      })
    })
  })
})
```

### Test Database

Tests use a separate `csheet_test` database on the same PostgreSQL instance. The `mise run test` task:

1. Automatically sets `POSTGRES_DB=csheet_test` environment variable
2. Creates the test database if it doesn't exist
3. Runs migrations on the test database
4. Executes tests with proper database connection

Each test runs inside a PostgreSQL transaction that rolls back after completion, ensuring isolation.

### Guidelines

- **Don't use `*` imports** - Import only what you need
- **Use nested describe blocks** - Organize tests by behavior and context
- **Use beforeEach for fixtures** - Set up data in the appropriate scope
- **Test behavior, not implementation** - Focus on what the user sees
- **Prefer full integration tests** - Test through HTTP, not individual functions
- **Make tests readable** - Tests should read like specifications

See `src/routes/character.test.ts` for a comprehensive example.
