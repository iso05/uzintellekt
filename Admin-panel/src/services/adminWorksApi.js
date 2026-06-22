import { cachedGridGet } from '../utils/cachedGridRequest';
import { invalidateCache } from '../utils/apiCache';
import api from './api';

// GET works grid for admin (same endpoint, cached 30s)
export async function adminGetWorks({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true }
} = {}) {
  return cachedGridGet('/api/v1/works/grid', { page, size, filters, sort });
}

// GET single work for admin
export async function adminGetWork(workId) {
  const data = await cachedGridGet('/api/v1/works/grid', {
    page: 1,
    size: 1,
    filters: [{ field: 'id', operator: 'eq', value: workId }]
  });
  const items = data?.items ?? [];
  if (!items.length) throw new Error('Asar topilmadi');
  return items[0];
}

// POST create work for user → invalidate cache
export async function createWorkForUser(userId, payload) {
  const response = await api.post(
    `/api/v1/admin/users/${userId}/works`,
    payload
  );
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// PATCH update work (admin) → invalidate cache
export async function adminUpdateWork(workId, payload) {
  const response = await api.patch(
    `/api/v1/admin/works/${workId}`,
    payload
  );
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// POST submit work (admin) → invalidate cache
export async function adminSubmitWork(workId) {
  const response = await api.post(
    `/api/v1/admin/works/${workId}/submit`
  );
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// PATCH cancel work (admin) → invalidate cache
export async function adminCancelWork(workId) {
  const response = await api.patch(
    `/api/v1/admin/works/${workId}/cancel`
  );
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}

// PATCH decide work (admin) → invalidate cache
export async function adminDecideWork(workId, decision, reason) {
  const payload = { decision };
  if (decision === 'REJECT' && reason) payload.reason = reason;
  const response = await api.patch(
    `/api/v1/admin/works/${workId}/decide`,
    payload
  );
  invalidateCache('/api/v1/works/grid');
  return response.data ?? response;
}
