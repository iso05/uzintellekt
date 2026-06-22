// src/pages/Contracts/ContractsList.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import {
  RiFileTextLine,
  RiSearchLine,
  RiRefreshLine,
  RiDownloadLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiArrowDownLine,
} from 'react-icons/ri'

const STATE_CONFIG = {
  CREATED: {
    label: 'Imzolangan',
    bg: '#dcfce7',
    color: '#15803d',
    border: '#86efac',
  },
  PENDING: {
    label: 'Kutilmoqda',
    bg: '#fef9c3',
    color: '#854d0e',
    border: '#fef08a',
  },
  TERMINATED: {
    label: 'Bekor qilingan',
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fca5a5',
  },
}

function StateBadge({ state }) {
  const cfg = STATE_CONFIG[state] || {
    label: state || 'Noma’lum',
    bg: '#f8fafc',
    color: '#94a3b8',
    border: '#e2e8f0',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  )
}

function SortIndicator({ field, currentSort }) {
  if (currentSort.selector !== field) {
    return (
      <span
        style={{
          color: 'var(--text-muted)',
          marginLeft: 6,
          fontSize: 10,
          opacity: 0.5,
        }}
      >
        ⇅
      </span>
    )
  }
  return currentSort.desc ? (
    <RiArrowDownLine
      size={12}
      color="var(--accent)"
      style={{ marginLeft: 6 }}
    />
  ) : (
    <RiArrowUpLine size={12} color="var(--accent)" style={{ marginLeft: 6 }} />
  )
}

export default function ContractsList() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [contracts, setContracts] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cache of retrieved users
  const [usersCache, setUsersCache] = useState({})

  // Set of blocked user IDs for quick synchronous check
  const [blockedUserIds, setBlockedUserIds] = useState(new Set())

  // Search state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchField, setSearchField] = useState('number')

  // Dropdown filter state
  const [filterState, setFilterState] = useState('')
  const [filterType, setFilterType] = useState('')

  // Sort state
  const [sort, setSort] = useState({ selector: 'id', desc: true })

  // Inline action state
  const [actionId, setActionId] = useState(null)

  const SIZE = 15

  // Helper function for user name formatting
  const formatUserName = (user) => {
    if (!user) return ''
    if (user.legalName) return user.legalName
    const parts = [user.lastName, user.firstName, user.middleName].filter(
      Boolean
    )
    if (parts.length > 0) {
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ')
    }
    return user.pseudonym || user.username || 'Foydalanuvchi'
  }

  // Debounce search input changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  // Fetch contracts from API using Salvadore1987/datagrid request payload format
  const load = useCallback(
    async (currentPage) => {
      setLoading(true)
      setError(null)
      try {
        // 1. Fetch blocked users first to ensure we have the latest list
        let currentBlockedIds = new Set()
        try {
          const { data: usersData } = await api.get(
            '/api/v1/admin/users/grid',
            {
              params: {
                gridRequest: JSON.stringify({
                  filters: [
                    { field: 'state', operator: 'eq', value: 'BLOCKED' },
                  ],
                  page: 0,
                  size: 1000,
                }),
              },
            }
          )
          currentBlockedIds = new Set(
            (usersData?.items || []).map((u) => u.id).filter(Boolean)
          )
          setBlockedUserIds(currentBlockedIds)

          // Add blocked users to usersCache
          const blockedMap = {}
          ;(usersData?.items || []).forEach((u) => {
            if (u && u.id) {
              blockedMap[u.id] = u
            }
          })
          setUsersCache((prev) => ({ ...prev, ...blockedMap }))
        } catch (err) {
          console.error('Failed to load blocked users:', err)
        }

        const baseFilters = []

        if (debouncedSearch.trim()) {
          if (searchField === 'userName') {
            const searchVal = debouncedSearch.trim()
            // Fetch matching users from users grid
            const [res1, res2, res3] = await Promise.all([
              api
                .get('/api/v1/admin/users/grid', {
                  params: {
                    gridRequest: JSON.stringify({
                      filters: [
                        { field: 'lastName', operator: 'lk', value: searchVal },
                      ],
                      page: 0,
                      size: 100,
                    }),
                  },
                })
                .catch(() => ({ data: { items: [] } })),
              api
                .get('/api/v1/admin/users/grid', {
                  params: {
                    gridRequest: JSON.stringify({
                      filters: [
                        {
                          field: 'firstName',
                          operator: 'lk',
                          value: searchVal,
                        },
                      ],
                      page: 0,
                      size: 100,
                    }),
                  },
                })
                .catch(() => ({ data: { items: [] } })),
              api
                .get('/api/v1/admin/users/grid', {
                  params: {
                    gridRequest: JSON.stringify({
                      filters: [
                        {
                          field: 'legalName',
                          operator: 'lk',
                          value: searchVal,
                        },
                      ],
                      page: 0,
                      size: 100,
                    }),
                  },
                })
                .catch(() => ({ data: { items: [] } })),
            ])

            const items = [
              ...(res1.data?.items || []),
              ...(res2.data?.items || []),
              ...(res3.data?.items || []),
            ]

            // Deduplicate matched users and store in usersCache
            const matchedUsers = {}
            items.forEach((u) => {
              if (u && u.id) {
                matchedUsers[u.id] = u
              }
            })

            setUsersCache((prev) => ({ ...prev, ...matchedUsers }))

            const matchedIds = Object.keys(matchedUsers)
            if (matchedIds.length === 0) {
              baseFilters.push({
                field: 'userId',
                operator: 'eq',
                value: '00000000-0000-0000-0000-000000000000',
              })
            } else {
              baseFilters.push({
                field: 'userId',
                operator: 'in',
                value: matchedIds.join(','),
              })
            }
          } else {
            baseFilters.push({
              field: searchField,
              operator: 'lk',
              value: debouncedSearch.trim(),
            })
          }
        }

        if (filterType) {
          baseFilters.push({
            field: 'type',
            operator: 'eq',
            value: filterType,
          })
        }

        let items = []
        let totalItems = 0
        let totalPagesCount = 0

        if (filterState === 'TERMINATED') {
          // Query 1: literal TERMINATED state
          const filters1 = [
            ...baseFilters,
            { field: 'state', operator: 'eq', value: 'TERMINATED' },
          ]
          const req1 = api.get('/api/v1/contracts/grid', {
            params: {
              gridRequest: JSON.stringify({
                filters: filters1,
                sort,
                page: currentPage,
                size: SIZE,
              }),
            },
          })

          // Query 2: contracts of blocked users
          let req2 = Promise.resolve({
            data: { items: [], totalItems: 0, totalPages: 0 },
          })
          if (currentBlockedIds.size > 0) {
            const filters2 = [
              ...baseFilters,
              {
                field: 'userId',
                operator: 'in',
                value: [...currentBlockedIds].join(','),
              },
            ]
            req2 = api.get('/api/v1/contracts/grid', {
              params: {
                gridRequest: JSON.stringify({
                  filters: filters2,
                  sort,
                  page: currentPage,
                  size: SIZE,
                }),
              },
            })
          }

          const [res1, res2] = await Promise.all([req1, req2])

          // Merge and deduplicate
          const mergedMap = new Map()
          ;(res1.data?.items || []).forEach((c) => mergedMap.set(c.id, c))
          ;(res2.data?.items || []).forEach((c) => mergedMap.set(c.id, c))

          const mergedList = [...mergedMap.values()]

          // Sort merged list client-side
          const sortField = sort.selector || 'id'
          const isDesc = sort.desc
          mergedList.sort((a, b) => {
            let valA = a[sortField] || ''
            let valB = b[sortField] || ''
            if (sortField === 'signedAt') {
              valA = new Date(valA).getTime() || 0
              valB = new Date(valB).getTime() || 0
            }
            if (valA < valB) return isDesc ? 1 : -1
            if (valA > valB) return isDesc ? -1 : 1
            return 0
          })

          items = mergedList
          totalItems = mergedList.length
          totalPagesCount = Math.ceil(totalItems / SIZE)
        } else if (filterState === 'CREATED') {
          // Query contracts with CREATED state
          const filters1 = [
            ...baseFilters,
            { field: 'state', operator: 'eq', value: 'CREATED' },
          ]
          const { data } = await api.get('/api/v1/contracts/grid', {
            params: {
              gridRequest: JSON.stringify({
                filters: filters1,
                sort,
                page: currentPage,
                size: SIZE,
              }),
            },
          })

          // Filter out blocked users' contracts
          const filteredList = (data?.items || []).filter(
            (c) => !currentBlockedIds.has(c.userId)
          )
          items = filteredList
          totalItems = filteredList.length
          totalPagesCount = Math.ceil(totalItems / SIZE)
        } else {
          // Barchasi: query all contracts
          const { data } = await api.get('/api/v1/contracts/grid', {
            params: {
              gridRequest: JSON.stringify({
                filters: baseFilters,
                sort,
                page: currentPage,
                size: SIZE,
              }),
            },
          })
          items = data?.items || []
          totalItems = data?.totalItems || 0
          totalPagesCount = data?.totalPages || 0
        }

        setContracts(items)
        setTotal(totalItems)
        setTotalPages(totalPagesCount)
      } catch (e) {
        setError(
          e.response?.data?.errorMessage ||
            e.message ||
            'Shartnomalarni yuklashda xatolik yuz berdi.'
        )
      } finally {
        setLoading(false)
      }
    },
    [debouncedSearch, searchField, filterState, filterType, sort]
  )

  // Load grid when page or dependencies change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page)
  }, [page, load])

  // Fetch missing users info dynamically
  useEffect(() => {
    if (contracts.length === 0) return

    const missingIds = contracts
      .map((c) => c.userId)
      .filter(Boolean)
      .filter((id) => !(id in usersCache))

    const uniqueMissingIds = [...new Set(missingIds)]

    if (uniqueMissingIds.length === 0) return

    let active = true

    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/api/v1/admin/users/grid', {
          params: {
            gridRequest: JSON.stringify({
              filters: [
                {
                  field: 'id',
                  operator: 'in',
                  value: uniqueMissingIds.join(','),
                },
              ],
              page: 0,
              size: Math.max(50, uniqueMissingIds.length),
            }),
          },
        })

        if (!active) return

        const fetchedMap = {}
        uniqueMissingIds.forEach((id) => {
          fetchedMap[id] = null
        })

        const items = data?.items || []
        items.forEach((u) => {
          if (u && u.id) {
            fetchedMap[u.id] = u
          }
        })

        setUsersCache((prev) => ({ ...prev, ...fetchedMap }))
      } catch (err) {
        console.error('Failed to load user details for contracts:', err)
      }
    }

    fetchUsers()

    return () => {
      active = false
    }
  }, [contracts, usersCache])

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  const handleSearchFieldChange = (e) => {
    setSearchField(e.target.value)
    setPage(0)
  }

  const handleFilterStateChange = (e) => {
    setFilterState(e.target.value)
    setPage(0)
  }

  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value)
    setPage(0)
  }

  const handleSortChange = (field) => {
    setSort((prev) => {
      const nextSort =
        prev.selector === field
          ? { selector: field, desc: !prev.desc }
          : { selector: field, desc: false }
      return nextSort
    })
    setPage(0)
  }

  const handleDownload = async (contractId) => {
    setActionId(contractId)
    try {
      const { data } = await api.get(`/api/v1/contracts/${contractId}/download`)
      if (data?.url) {
        window.open(data.url, '_blank')
      } else {
        alert('Yuklab olish havolasi topilmadi.')
      }
    } catch (e) {
      alert(
        e.response?.data?.errorMessage ||
          e.message ||
          'Yuklab olishda xatolik yuz berdi.'
      )
    } finally {
      setActionId(null)
    }
  }

  // Theme-sensitive styles
  const textColor = isDark ? '#f1f2f6' : '#111827'
  const textSecondary = isDark ? '#9094a8' : '#4b5563'
  const border = isDark ? '#2a2d3a' : '#e2e4ec'
  const cardBg = isDark ? '#1a1d27' : '#ffffff'
  const altRowBg = isDark ? '#202432' : '#f8fafc'
  const tableHeaderBg = isDark ? '#13161f' : '#f1f5f9'
  const hoverRowBg = isDark ? '#272b3c' : '#f1f5f9'

  const S = {
    page: {
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    toolbar: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    // Search group
    searchContainer: {
      display: 'flex',
      flex: 1,
      minWidth: 320,
      maxWidth: 460,
      borderRadius: 10,
      border: `1px solid ${border}`,
      overflow: 'hidden',
    },
    selectSearchField: {
      padding: '9px 12px',
      border: 'none',
      borderRight: `1px solid ${border}`,
      outline: 'none',
      background: cardBg,
      color: textColor,
      fontSize: 13.5,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontWeight: 500,
    },
    searchWrap: { position: 'relative', flex: 1 },
    searchIcon: {
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: 'translateY(-50%)',
    },
    searchInput: {
      width: '100%',
      padding: '9px 12px 9px 36px',
      border: 'none',
      fontSize: 13.5,
      outline: 'none',
      background: cardBg,
      color: textColor,
      fontFamily: 'inherit',
    },

    // Filters group
    filtersRow: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    filterLabel: {
      fontSize: 9.5,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    },
    filterSelect: {
      padding: '8px 12px',
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      color: textColor,
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      minWidth: 120,
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      border: `1px solid ${border}`,
      background: cardBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: textSecondary,
      alignSelf: 'flex-end',
      transition: 'background-color 0.2s',
    },

    errorBox: {
      padding: '10px 14px',
      borderRadius: 10,
      background: 'rgba(239,68,68,.12)',
      border: '1px solid rgba(239,68,68,.2)',
      color: 'var(--danger)',
      fontSize: 13.5,
    },
    card: {
      background: cardBg,
      borderRadius: 16,
      border: `1px solid ${border}`,
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
      animation: 'fadeUp .3s ease both',
    },
    center: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '70px 20px',
      gap: 4,
    },
    spinner: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: `3px solid ${border}`,
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite',
    },
    spinnerMini: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      border: '2px solid transparent',
      borderTopColor: 'currentColor',
      borderRightColor: 'currentColor',
      animation: 'spin 0.6s linear infinite',
      display: 'inline-block',
    },

    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      borderBottom: `1px solid ${border}`,
      whiteSpace: 'nowrap',
      background: tableHeaderBg,
    },
    thActions: {
      width: 140,
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '.05em',
      borderBottom: `1px solid ${border}`,
      whiteSpace: 'nowrap',
      background: tableHeaderBg,
    },
    thContent: { display: 'flex', alignItems: 'center' },
    td: {
      padding: '13px 14px',
      fontSize: 13.5,
      color: textColor,
      borderBottom: `1px solid ${border}`,
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 600,
      transition: 'opacity 0.2s',
      background: 'var(--accent)',
      color: '#fff',
    },

    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: `1px solid ${border}`,
      flexWrap: 'wrap',
      gap: 8,
    },
    pageBtn: {
      width: 30,
      height: 30,
      borderRadius: 7,
      border: `1px solid ${border}`,
      background: cardBg,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      color: textSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
    },
    pageBtnActive: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
  }

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .th-sortable { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        .th-sortable:hover { background-color: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} !important; }
        .table-row { transition: background-color 0.15s; }
        .table-row:hover { background-color: ${hoverRowBg} !important; }
      `}</style>

      {/* Toolbar */}
      <div style={S.toolbar}>
        {/* Search */}
        <div style={S.searchContainer}>
          <select
            style={S.selectSearchField}
            value={searchField}
            onChange={handleSearchFieldChange}
          >
            <option value="number">Shartnoma №</option>
            <option value="userName">Foydalanuvchi ismi</option>
          </select>
          <div style={S.searchWrap}>
            <RiSearchLine size={15} color="#94a3b8" style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Qidiruv..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Filters and Refresh */}
        <div style={S.filtersRow}>
          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Holati</label>
            <select
              style={S.filterSelect}
              value={filterState}
              onChange={handleFilterStateChange}
            >
              <option value="">Barchasi</option>
              <option value="CREATED">Imzolangan</option>
              <option value="TERMINATED">Bekor qilingan</option>
            </select>
          </div>

          <div style={S.filterGroup}>
            <label style={S.filterLabel}>Turi</label>
            <select
              style={S.filterSelect}
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="">Barchasi</option>
              <option value="MEMBERSHIP">A'zolik</option>
              <option value="LICENSE">License</option>
            </select>
          </div>

          <button
            style={S.refreshBtn}
            onClick={() => load(page)}
            title="Yangilash"
          >
            <RiRefreshLine size={16} />
          </button>
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      {/* Table Card */}
      <div style={S.card}>
        {loading ? (
          <div style={S.center}>
            <div style={S.spinner} />
          </div>
        ) : contracts.length === 0 ? (
          <div style={S.center}>
            <RiFileTextLine size={44} color="#cbd5e1" />
            <p style={{ color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>
              Shartnomalar topilmadi
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th
                    style={S.th}
                    className="th-sortable"
                    onClick={() => handleSortChange('number')}
                  >
                    <div style={S.thContent}>
                      Shartnoma №{' '}
                      <SortIndicator field="number" currentSort={sort} />
                    </div>
                  </th>
                  <th style={S.th}>Foydalanuvchi</th>
                  <th style={S.th}>Turi</th>
                  <th
                    style={S.th}
                    className="th-sortable"
                    onClick={() => handleSortChange('signedAt')}
                  >
                    <div style={S.thContent}>
                      Imzolangan vaqti{' '}
                      <SortIndicator field="signedAt" currentSort={sort} />
                    </div>
                  </th>
                  <th style={S.th}>Holat</th>
                  <th style={S.thActions}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, i) => {
                  const typeLabel =
                    c.type === 'MEMBERSHIP' ? "A'zolik" : 'License'
                  const typeBg = c.type === 'MEMBERSHIP' ? '#e0f2fe' : '#faf5ff'
                  const typeColor =
                    c.type === 'MEMBERSHIP' ? '#0369a1' : '#6b21a8'

                  const user = usersCache[c.userId]
                  const isBlocked = blockedUserIds.has(c.userId)
                  const displayState = isBlocked ? 'TERMINATED' : c.state

                  return (
                    <tr
                      key={c.id}
                      className="table-row"
                      style={{ background: i % 2 === 1 ? altRowBg : cardBg }}
                    >
                      <td
                        style={{
                          ...S.td,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        {c.number || '—'}
                      </td>
                      <td
                        style={{ ...S.td, fontSize: 13, color: textSecondary }}
                      >
                        {(() => {
                          if (!(c.userId in usersCache)) {
                            return (
                              <span
                                style={{
                                  color: 'var(--text-muted)',
                                  fontSize: 12,
                                }}
                              >
                                Yuklanmoqda...
                              </span>
                            )
                          }
                          return user ? formatUserName(user) : c.userId || '—'
                        })()}
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: typeBg,
                            color: typeColor,
                          }}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td
                        style={{ ...S.td, color: textSecondary, fontSize: 13 }}
                      >
                        {c.signedAt || '—'}
                      </td>
                      <td style={S.td}>
                        <StateBadge state={displayState} />
                      </td>
                      <td style={S.td}>
                        <button
                          style={S.actionBtn}
                          disabled={actionId === c.id}
                          onClick={() => handleDownload(c.id)}
                          title="Faylni yuklab olish"
                        >
                          {actionId === c.id ? (
                            <span style={S.spinnerMini} />
                          ) : (
                            <RiDownloadLine size={14} />
                          )}
                          <span>Yuklab olish</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={S.pagination}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {total} ta dan {page * SIZE + 1}–
              {Math.min((page + 1) * SIZE, total)}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                style={{ ...S.pageBtn, opacity: page === 0 ? 0.4 : 1 }}
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <RiArrowLeftLine size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => (
                <button
                  key={i}
                  style={{
                    ...S.pageBtn,
                    ...(i === page ? S.pageBtnActive : {}),
                  }}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                style={{
                  ...S.pageBtn,
                  opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <RiArrowRightLine size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
