import { LayoutDashboard, ShieldCheck, Users, FolderArchive, FileSignature } from 'lucide-react'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  MODERATION: '/moderation',
  WORK_DETAIL: (id) => `/moderation/${id}`,
  USERS: '/users',
  USER_DETAIL: (id) => `/users/${id}`,
  FILES: '/files',
  CONTRACTS: '/contracts',
}

// Sidebar navigation — data-driven so we don't repeat <NavLink> blocks.
// Labels are resolved via i18n (nav.<key>) in the sidebar.
export const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.MODERATION, key: 'moderation', icon: ShieldCheck },
  { to: ROUTES.USERS, key: 'users', icon: Users },
  { to: ROUTES.FILES, key: 'files', icon: FolderArchive },
  { to: ROUTES.CONTRACTS, key: 'contracts', icon: FileSignature },
]

// Breadcrumb resolution (one source of truth). Labels are resolved via i18n
// (crumbs.*) by the layout; only the i18n key + target path live here.
export function resolveRouteMeta(pathname) {
  const home = { labelKey: 'crumbs.home', to: ROUTES.DASHBOARD }

  if (pathname === ROUTES.DASHBOARD) {
    return { crumbs: [home] }
  }
  if (pathname === ROUTES.MODERATION) {
    return { crumbs: [home, { labelKey: 'crumbs.moderation', to: ROUTES.MODERATION }] }
  }
  if (pathname.startsWith('/moderation/')) {
    return {
      crumbs: [
        home,
        { labelKey: 'crumbs.moderation', to: ROUTES.MODERATION },
        { labelKey: 'crumbs.detail', to: pathname },
      ],
    }
  }
  if (pathname === ROUTES.USERS) {
    return { crumbs: [home, { labelKey: 'crumbs.users', to: ROUTES.USERS }] }
  }
  if (pathname.startsWith('/users/')) {
    return {
      crumbs: [
        home,
        { labelKey: 'crumbs.users', to: ROUTES.USERS },
        { labelKey: 'crumbs.detail', to: pathname },
      ],
    }
  }
  if (pathname === ROUTES.FILES) {
    return { crumbs: [home, { labelKey: 'crumbs.files', to: ROUTES.FILES }] }
  }
  if (pathname === ROUTES.CONTRACTS) {
    return { crumbs: [home, { labelKey: 'crumbs.contracts', to: ROUTES.CONTRACTS }] }
  }
  return { crumbs: [home] }
}
