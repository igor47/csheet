
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

- Using `bun:sqlite` for SQLite database
- Models defined in `src/db/` (e.g., `users.ts`)
- Database helpers: `findById`, `findByEmail`, `create`, etc.

## APIs

- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```
- i don't like * imports, please import what you need only