import type { User } from "@src/db/users";

export interface WelcomeProps {
  user?: User;
}

const LoggedInContent = () => (
  <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
    <a href="/character/new" class="btn btn-primary btn-lg">Create Character</a>
    <a href="/character/view" class="btn btn-outline-secondary btn-lg">View Character</a>
  </div>
);

const LoggedOutContent = () => (
  <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
    <a href="/login" class="btn btn-primary btn-lg">Login to Get Started</a>
  </div>
);

export const Welcome = ({ user }: WelcomeProps) => (
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6 text-center">
        <h1 class="display-4 mb-4">Welcome to CSheet</h1>
        <p class="lead mb-4">
          An app for managing your D&D characters
        </p>
        {user ? <LoggedInContent /> : <LoggedOutContent />}
      </div>
    </div>
  </div>
)