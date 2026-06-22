import { cachedGridGet } from '../utils/cachedGridRequest';
import { invalidateCache } from '../utils/apiCache';
import api from './api';

// GET works grid (cached 30s)
export async function getWorks({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true }
} = {}) {
  return cachedGridGet('/api/v1/works/grid', { page, size, filters, sort });
}

// GET single work by id via grid (cached 30s)
export async function getWork(workId) {
  const data = await cachedGridGet('/api/v1/works/grid', {
    page: 1,
    size: 1,
    filters: [{ field: 'id', operator: 'eq', value: workId }]
  });
  const items = data?.items ?? [];
  if (!items.length) throw new Error('Asar topilmadi');
  return items[0];
}

// GET my contributions (no pagination — use regular GET)
export async function getMyContributions() {
  const response = await api.get('/api/v1/works/my-contributions');
  return response.data ?? response;
}

// POST create work → invalidate works cache
export async function createWork(payload) {
  const response = await api.post('/api/v1/works', payload);
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// PATCH update work → invalidate works cache
export async function updateWork(workId, payload) {
  const response = await api.patch(`/api/v1/works/${workId}`, payload);
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// POST submit work → invalidate works cache
export async function submitWork(workId) {
  const response = await api.post(`/api/v1/works/${workId}/submit`);
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// PATCH cancel work → invalidate works cache
export async function cancelWork(workId) {
  const response = await api.patch(`/api/v1/works/${workId}/cancel`);
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}
