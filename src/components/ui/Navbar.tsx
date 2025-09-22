export interface NavbarProps {
  currentPage?: string;
  isLoggedIn?: boolean;
}

export const Navbar = ({ currentPage, isLoggedIn }: NavbarProps) => {
  const collapseId = "navbarContent";

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
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Link</a>
            </li>
            <li class="nav-item">
              <a class="nav-link disabled" aria-disabled="true">Disabled</a>
            </li>
          </ul>
          <form class="d-flex" role="search">
            <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search"/>
            <button class="btn btn-outline-success" type="submit">Search</button>
          </form>
        </div>
      </div>
    </nav>
  )
}
