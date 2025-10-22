# CSheet

A D&D character sheet manager with support for multiple rulesets.
Track your character's abilities, skills, spells, hit points, and more with a clean web interface.

## Prerequisites

This project uses **[mise](https://mise.jdx.dev/)** for managing tools and dependencies.

To install mise, visit the [mise installation guide](https://mise.jdx.dev/getting-started.html).

Once mise is installed, run:

```bash
mise install
```

This will install all required tools including:
- **Bun** - Fast JavaScript runtime and bundler
- **dbmate** - Database migration tool
- **jj** - Version control
- **jq** - JSON processor

## Getting Started

Install dependencies:

```bash
mise run install
```

Start Docker services (PostgreSQL and MinIO):

```bash
mise run deps:up
```

Run database migrations:

```bash
mise run db:upgrade
```

Start the development server:

```bash
mise run app:dev
```

The `app:dev` task automatically starts Docker services if they're not running.

The application will be available at `http://localhost:3000`.

## Task Runner

This project uses `mise run` for all common tasks:

| Command | Description |
|---------|-------------|
| `mise run app:dev` | Start development server with hot reload |
| `mise run app:prod` | Start production server |
| `mise run app:container` | Build and run the app inside the local Docker Compose stack |
| `mise run deploy:push` | Build and push the application image to Artifact Registry |
| `mise run infra:preview` | Preview infrastructure changes (VPC, Cloud SQL, secrets, service accounts, Artifact Registry) |
| `mise run infra:up` | Apply infrastructure changes |
| `mise run infra:destroy` | Destroy the infrastructure stack |
| `mise run deploy:preview` | Preview Cloud Run service and migration job changes |
| `mise run deploy:up` | Deploy the Cloud Run service and migration job |
| `mise run deploy:destroy` | Remove the Cloud Run service and migration job |
| `mise run install` | Install dependencies with bun |
| `mise run test` | Run all tests with test database |
| `mise run deps:up` | Start all Docker services (PostgreSQL and MinIO) |
| `mise run deps:down` | Stop all Docker services |
| `mise run db:upgrade` | Run database migrations |
| `mise run dbmate <command>` | Run dbmate commands (see Database section) |
| `mise run db:psql` | Open PostgreSQL shell for the database |
| `mise run check` | Run Biome linting/formatting checks and TypeScript validation |
| `mise run check-fix` | Auto-fix linting/formatting issues and check types |

The containerized app uses the `app` compose profile. Stop it (and supporting services) with `docker compose --profile app down`.

## Database

CSheet uses **PostgreSQL 16** for data storage with **dbmate** for schema migrations.

### Migrations

Migrations are stored in the `migrations/` directory. Each migration file is timestamped and contains SQL to modify the database schema.

Common dbmate commands:

```bash
# Apply all pending migrations
mise run db:upgrade

# Create a new migration
mise run dbmate new create_something

# Rollback the last migration
mise run dbmate down

# Show migration status
mise run dbmate status
```

### Test Database

Tests use a separate `csheet_test` database on the same PostgreSQL instance.

The test database is automatically created and migrated when you run:

```bash
mise run test
```

Each test runs inside a PostgreSQL transaction that is rolled back after the test completes, ensuring a clean database state between tests.

### Database Schema

The database includes tables for:
- **users** - User authentication
- **characters** - Character base info (name, species, background, ruleset)
- **character_levels** - Character class levels and progression
- **character_abilities** - Ability scores (STR, DEX, CON, INT, WIS, CHA)
- **character_skills** - Skill proficiencies and modifiers
- **character_hp** - Hit points tracking
- **character_hit_dice** - Hit dice tracking
- **character_spell_slots** - Spell slot tracking
- **character_spells_learned** - Spellbook/known spells
- **character_spells_prepared** - Prepared spells

### Database Shell

Open an interactive PostgreSQL shell:

```bash
mise run db:psql
```

## Architecture

CSheet is built with modern web technologies focused on server-side rendering and progressive enhancement:

### Tech Stack

- **[Hono](https://hono.dev/)** - Lightweight web framework
- **JSX Server-Side Rendering** - Components rendered on the server
- **[htmx](https://htmx.org/)** - Client-side interactions without writing JavaScript
- **[Bootstrap 5](https://getbootstrap.com/)** - CSS framework for styling
- **[Bun](https://bun.sh/)** - Fast all-in-one JavaScript runtime

### Server-Side Rendering

All pages are rendered server-side using JSX components.
The Hono framework provides JSX rendering out of the box, allowing you to write components that look like React but render to HTML on the server.

### Client-Side Interactions

Instead of a heavy JavaScript framework, CSheet uses **htmx** for dynamic interactions.
htmx allows you to:
- Submit forms without page reloads
- Update parts of the page with server responses
- Trigger actions with minimal JavaScript

Example: Updating a character's ability score sends a POST request and the server returns updated HTML that htmx swaps into the page.

## Project Structure

```
csheet/
├── src/
│   ├── app.ts                  # Main application, registers routes and middleware
│   ├── config.ts               # Configuration (database path, ports, etc.)
│   ├── db.ts                   # Database connection
│   ├── middleware.ts           # Middleware registration
│   ├── components/             # JSX components for rendering pages
│   │   ├── Layout.tsx          # Main layout wrapper with navbar
│   │   ├── Welcome.tsx         # Home page
│   │   ├── ...
│   │   └── ui/                 # Reusable UI components
│   ├── routes/                 # Route handlers
│   │   ├── index.tsx           # Home route (/)
│   │   ├── auth.tsx            # Authentication routes
│   │   ├── character.tsx       # Character CRUD and update routes
│   │   └── spells.tsx          # Spell reference routes
│   ├── middleware/             # Middleware
│   │   ├── auth.ts             # Authentication middleware
│   │   ├── flash.ts            # Flash messages
│   │   └── cachingServeStatic.ts # Static file serving with caching
│   ├── db/                     # Database models and queries
│   │   ├── users.ts
│   │   ├── char_hp.ts
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── createCharacter.ts
│   │   ├── computeCharacter.ts # Compute derived stats
│   │   ├── longRest.ts
│   │   └── ...
│   └── lib/                    # Utilities and helpers
│       ├── dnd/                # D&D rules engine
│       │   ├── rulesets.ts     # Ruleset loader
│       │   ├── srd51.ts        # D&D 5e SRD 5.1 rules
│       │   └── srd52.ts        # D&D 5e SRD 5.2 rules
│       ├── schemas.ts          # Zod validation schemas
│       └── ...
├── migrations/                 # Database migrations
├── db/                         # Database utilities
│   ├── init.sql                # SQLite initialization
│   └── schema.sql              # Full schema dump
├── static/                     # Static assets (CSS, images, etc.)
├── mise.toml                   # mise configuration
└── main.ts                     # Application entry point
```

## D&D Rulesets

CSheet supports multiple D&D 5th edition rulesets:

- **SRD 5.1** - D&D 5th Edition System Reference Document v5.1
- **SRD 5.2** - D&D 5th Edition System Reference Document v5.2 (2024 rules)

### Ruleset System

The ruleset system is pluggable and defined in `src/lib/dnd/`:

- `rulesets.ts` - Ruleset loader and interface
- `srd51.ts` - SRD 5.1 class definitions, spells, species, etc.
- `srd52.ts` - SRD 5.2 class definitions, spells, species, etc.

Each character is associated with a ruleset, allowing players to use either the 2014 or 2024 rules. The ruleset determines:
- Available species (races)
- Class features and progressions
- Spell lists
- Ability score calculations
- Proficiency bonuses

## Development

### Testing

CSheet uses **Bun's built-in test runner** for testing with a comprehensive integration testing setup.

Run all tests:

```bash
mise run test
```

Run specific test file:

```bash
mise run test src/routes/character.test.ts
```

#### Test Infrastructure

- **Test Database**: Uses separate `csheet_test` database
- **Transaction Isolation**: Each test runs in a transaction that auto-rolls back
- **Factory Pattern**: Test fixtures created with [fishery](https://github.com/thoughtbot/fishery) and [@faker-js/faker](https://fakerjs.dev/)
- **HTML Testing**: Server-rendered HTML validated with [linkedom](https://github.com/WebReflection/linkedom)
- **Integration Tests**: Full-stack tests through HTTP requests (not unit tests)

#### Writing Tests

Tests use RSpec-style nested describe blocks with fixtures:

```typescript
import { describe, test, expect, beforeEach } from "bun:test"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { makeRequest, parseHtml, expectElement } from "@src/test/http"

describe("GET /characters", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    test("displays the character list", async () => {
      const response = await makeRequest(testCtx.app, "/characters", { user })
      const document = await parseHtml(response)

      const title = expectElement(document, "title")
      expect(title.textContent).toContain("My Characters")
    })
  })
})
```

See `src/routes/character.test.ts` for a complete example.

### Code Quality

The project uses **Biome** for linting and formatting, and **TypeScript** for type checking.

Run checks:

```bash
mise run check
```

Auto-fix issues:

```bash
mise run check-fix
```

### Project Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines including:
- Using Bun instead of Node.js
- Hono framework patterns
- Component structure
- Authentication patterns
- Database conventions
- Testing patterns
