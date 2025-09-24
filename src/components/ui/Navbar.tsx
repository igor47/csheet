import type { User } from "@src/db/users";

export interface NavbarProps {
  currentPage?: string;
  user?: User;
}

interface NavLink {
  href: string;
  label: string;
  isActive: boolean;
}

const getNavLinks = (isLoggedIn: boolean, currentPage?: string): NavLink[] => {
  const allLinks = [
    { href: '/', label: 'Home', requiresAuth: undefined },
  ];

  return allLinks
    .filter(link => {
      if (link.requiresAuth === true) return isLoggedIn;
      if (link.requiresAuth === false) return !isLoggedIn;
      return true;
    })
    .map(link => ({
      href: link.href,
      label: link.label,
      isActive: currentPage === link.href,
    }));
};

const LoggedInContent = ({ user }: { user: User }) => {
  const username = user.email?.split('@')[0];

  return (
    <div class="d-flex align-items-center">
      <span class="navbar-text me-3">
        {username}
      </span>
      <a href="/logout" class="btn btn-outline-secondary btn-sm">Logout</a>
    </div>
  );
};

const LoggedOutContent = () => (
  <a href="/login" class="btn btn-outline-primary btn-sm">Login</a>
);

export const Navbar = ({ currentPage, user }: NavbarProps) => {
  const collapseId = "navbarContent";
  const navLinks = getNavLinks(!!user, currentPage);

  return (
    <nav class="navbar navbar-expand-md bg-body-tertiary">
      <div class="container-fluid">
        <a class="navbar-brand" href="/">
          <img
            src="/static/logo-original.svg"
            alt="Logo"
            width="30" height="30" class="d-inline-block align-text-top" />
          CSheet
        </a>

        <button class="navbar-toggler" type="button"
          data-bs-toggle="collapse" data-bs-target={ '#' + collapseId }
          aria-controls={ '#' + collapseId } aria-expanded="false" aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id={ collapseId }>
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            {navLinks.map(link => (
              <li class="nav-item">
                <a
                  class={`nav-link ${link.isActive ? 'active' : ''}`}
                  aria-current={link.isActive ? 'page' : undefined}
                  href={link.href}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {user ? <LoggedInContent user={user} /> : <LoggedOutContent />}
        </div>
      </div>
    </nav>
  )
}
