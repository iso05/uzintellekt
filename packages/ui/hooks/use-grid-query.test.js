import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGridQuery } from './use-grid-query'

const PAGE = { items: [{ id: 1 }, { id: 2 }], totalItems: 2, totalPages: 1 }

describe('useGridQuery', () => {
  it('calls the fetcher with page/size/filters/sort and exposes the result', async () => {
    const fetcher = vi.fn().mockResolvedValue(PAGE)
    const filters = [{ field: 'state', operator: 'eq', value: 'X' }]
    const sort = { selector: 'createdAt', desc: true }

    const { result } = renderHook(() => useGridQuery({ fetcher, pageSize: 10, filters, sort }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledWith({ page: 1, size: 10, filters, sort })
    expect(result.current.items).toEqual(PAGE.items)
    expect(result.current.totalItems).toBe(2)
  })

  it('passes sort as undefined when none is set', async () => {
    const fetcher = vi.fn().mockResolvedValue(PAGE)
    const { result } = renderHook(() => useGridQuery({ fetcher }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(fetcher).toHaveBeenCalledWith({ page: 1, size: 10, filters: [], sort: undefined })
  })

  it('resets to page 1 when filters change', async () => {
    const fetcher = vi.fn().mockResolvedValue(PAGE)
    const { result, rerender } = renderHook(({ filters }) => useGridQuery({ fetcher, filters }), {
      initialProps: { filters: [] },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPage(3))
    await waitFor(() => expect(result.current.page).toBe(3))

    rerender({ filters: [{ field: 'state', operator: 'eq', value: 'Y' }] })
    await waitFor(() => expect(result.current.page).toBe(1))
  })

  it('does not fire a redundant request for the old page when filters change from a deep page', async () => {
    const fetcher = vi.fn().mockResolvedValue(PAGE)
    const { result, rerender } = renderHook(({ filters }) => useGridQuery({ fetcher, filters }), {
      initialProps: { filters: [] },
    })
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setPage(3))
    await waitFor(() => expect(result.current.page).toBe(3))

    fetcher.mockClear()
    const newFilters = [{ field: 'state', operator: 'eq', value: 'Y' }]
    rerender({ filters: newFilters })
    await waitFor(() => expect(result.current.page).toBe(1))

    // The old page number must never be requested under the new filters.
    expect(fetcher).not.toHaveBeenCalledWith(expect.objectContaining({ page: 3, filters: newFilters }))
    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ page: 1, filters: newFilters }))
  })

  it('surfaces a fetcher error without crashing', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useGridQuery({ fetcher }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('boom')
    expect(result.current.items).toEqual([])
  })
})
