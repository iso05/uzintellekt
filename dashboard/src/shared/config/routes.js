import { Home, FileText, FileSignature, User } from 'lucide-react'

export const ROUTES = {
  DASHBOARD: '/',
  PROFILE: '/profile',
  WORKS: '/works',
  WORK_NEW: '/works/new',
  WORK_EDIT: (id) => `/works/${id}/edit`,
  CONTRACTS: '/contracts',
}

// Sidebar navigation — data-driven so we don't repeat <NavLink> blocks.
// Labels are resolved via i18n (nav.<key>) in the sidebar.
export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, key: 'dashboard', icon: Home, end: true },
  { to: ROUTES.WORKS, key: 'works', icon: FileText },
  { to: ROUTES.CONTRACTS, key: 'contracts', icon: FileSignature },
  { to: ROUTES.PROFILE, key: 'profile', icon: User },
]

// Breadcrumb resolution (one source of truth). Labels are resolved via i18n
// (crumbs.*) by the layout; only the i18n key + target path live here.
export function resolveRouteMeta(pathname) {
  if (pathname === ROUTES.DASHBOARD) {
    return { crumbs: [{ labelKey: 'crumbs.home', to: ROUTES.DASHBOARD }] }
  }
  if (pathname === ROUTES.PROFILE) {
    return {
      crumbs: [
        { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.profile', to: ROUTES.PROFILE },
      ],
    }
  }
  if (pathname === ROUTES.WORKS) {
    return {
      crumbs: [
        { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', to: ROUTES.WORKS },
      ],
    }
  }
  if (pathname === ROUTES.WORK_NEW) {
    return {
      crumbs: [
        { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', to: ROUTES.WORKS },
        { labelKey: 'crumbs.new_work', to: ROUTES.WORK_NEW },
      ],
    }
  }
  if (pathname.startsWith('/works/') && pathname.endsWith('/edit')) {
    return {
      crumbs: [
        { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', to: ROUTES.WORKS },
        { labelKey: 'crumbs.edit', to: pathname },
      ],
    }
  }
  if (pathname === ROUTES.CONTRACTS) {
    return {
      crumbs: [
        { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.contracts', to: ROUTES.CONTRACTS },
      ],
    }
  }
  return { crumbs: [{ labelKey: 'crumbs.home', to: ROUTES.DASHBOARD }] }
}
