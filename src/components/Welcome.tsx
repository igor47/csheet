import type { User } from "@src/db/users"

export interface WelcomeProps {
  user?: User
}

const LoggedInContent = () => (
  <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
    <a href="/characters/view" class="btn btn-primary btn-lg">
      View Characters
    </a>
    <a href="/characters/new" class="btn btn-primary btn-lg">
      Create Character
    </a>
  </div>
)

const LoggedOutContent = () => (
  <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
    <a href="/login" class="btn btn-primary btn-lg">
      Login to Get Started
    </a>
  </div>
)

export const Welcome = ({ user }: WelcomeProps) => (
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-lg-10 col-xl-8">
        {/* Hero Section */}
        <div class="text-center mb-5">
          <h1 class="display-3 mb-4">Welcome to CSheet</h1>
          <p class="lead mb-4">
            Your open-source, self-hostable companion for D&D character management
          </p>
          {user ? <LoggedInContent /> : <LoggedOutContent />}
        </div>

        {/* Main Features */}
        <div class="row mb-5">
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <h3 class="card-title h5">
                  <i class="bi bi-book me-2"></i>
                  2014 & 2024 Rulesets
                </h3>
                <p class="card-text">
                  Full support for both D&D 5th Edition System Reference Documents - SRD 5.1 (2014)
                  and SRD 5.2 (2024). Create characters using either ruleset with accurate class
                  features, spells, and progression tables.
                </p>
              </div>
            </div>
          </div>

          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <h3 class="card-title h5">
                  <i class="bi bi-github me-2"></i>
                  Open Source & Self-Hostable
                </h3>
                <p class="card-text">
                  CSheet is free and open-source software. Run it on your own server, modify it to
                  fit your table's house rules, or contribute improvements back to the community.
                </p>
              </div>
            </div>
          </div>

          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <h3 class="card-title h5">
                  <i class="bi bi-dice-6 me-2"></i>
                  Not a Virtual Tabletop
                </h3>
                <p class="card-text">
                  CSheet is designed as an aid for your game, not a replacement for the table. Roll
                  your own dice, engage with your fellow players, and use CSheet to track your
                  character's stats, spells, and progression.
                </p>
              </div>
            </div>
          </div>

          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <h3 class="card-title h5">
                  <i class="bi bi-lightning-charge me-2"></i>
                  Fast & Lightweight
                </h3>
                <p class="card-text">
                  Built with modern web technologies including Hono, htmx, and Bun. Server-side
                  rendering means fast page loads and a responsive experience on any device -
                  desktop, tablet, or phone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot Placeholder */}
        <div class="text-center mb-5">
          <div class="card bg-dark border-secondary">
            <div class="card-body py-5">
              <i class="bi bi-image" style="font-size: 4rem; color: var(--bs-secondary);"></i>
              <p class="text-muted mt-3 mb-0">Character sheet screenshot coming soon</p>
            </div>
          </div>
        </div>

        {/* What CSheet Helps You Track */}
        <div class="mb-5">
          <h2 class="h3 mb-4 text-center">What You Can Track</h2>
          <div class="row">
            <div class="col-md-6">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Ability scores and
                  modifiers
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Skills and proficiencies
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Hit points and hit dice
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Class levels and features
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <ul class="list-unstyled">
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Spell slots and prepared
                  spells
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Character background and
                  species
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Long rest mechanics
                </li>
                <li class="mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>Multiclass support
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div class="text-center">
          <h2 class="h3 mb-4">Ready to Start Your Adventure?</h2>
          <p class="mb-4">
            Create an account and start managing your D&D characters with CSheet today.
          </p>
          {user ? <LoggedInContent /> : <LoggedOutContent />}
        </div>
      </div>
    </div>
  </div>
)
