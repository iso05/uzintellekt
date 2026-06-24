import { Home, FileText, FileSignature, User } from 'lucide-react'

export const ROUTES = {
  DASHBOARD: '/',
  PROFILE: '/profile',
  WORKS: '/works',
  WORK_NEW: '/works/new',
  WORK_EDIT: (id) => `/works/${id}/edit`,
  CONTRACTS: '/contracts',
}

// Sidebar navigation — data-driven so we don't repeat <NavLink> blocks
export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, key: 'dashboard', label: 'Asosiy', icon: Home, end: true },
  { to: ROUTES.WORKS, key: 'works', label: 'Asarlarim', icon: FileText },
  { to: ROUTES.CONTRACTS, key: 'contracts', label: 'Shartnomalarim', icon: FileSignature },
  { to: ROUTES.PROFILE, key: 'profile', label: 'Profil', icon: User },
]

// Page title + breadcrumb resolution (one source of truth for header/breadcrumbs)
export function resolveRouteMeta(pathname) {
  if (pathname === ROUTES.DASHBOARD) {
    return { title: 'Asosiy', crumbs: [{ labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD }] }
  }
  if (pathname === ROUTES.PROFILE) {
    return {
      title: 'Profil',
      crumbs: [
        { labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.profile', label: 'Profil', to: ROUTES.PROFILE },
      ],
    }
  }
  if (pathname === ROUTES.WORKS) {
    return {
      title: 'Asarlarim',
      crumbs: [
        { labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', label: 'Asarlar', to: ROUTES.WORKS },
      ],
    }
  }
  if (pathname === ROUTES.WORK_NEW) {
    return {
      title: 'Yangi asar',
      crumbs: [
        { labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', label: 'Asarlar', to: ROUTES.WORKS },
        { labelKey: 'crumbs.new_work', label: 'Yangi asar', to: ROUTES.WORK_NEW },
      ],
    }
  }
  if (pathname.startsWith('/works/') && pathname.endsWith('/edit')) {
    return {
      title: 'Asarni tahrirlash',
      crumbs: [
        { labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.works', label: 'Asarlar', to: ROUTES.WORKS },
        { labelKey: 'crumbs.edit', label: 'Tahrirlash', to: pathname },
      ],
    }
  }
  if (pathname === ROUTES.CONTRACTS) {
    return {
      title: 'Shartnomalarim',
      crumbs: [
        { labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD },
        { labelKey: 'crumbs.contracts', label: 'Shartnomalarim', to: ROUTES.CONTRACTS },
      ],
    }
  }
  return { title: 'Dashboard', crumbs: [{ labelKey: 'crumbs.home', label: 'Bosh sahifa', to: ROUTES.DASHBOARD }] }
}
