import { cachedGridGet } from '../utils/cachedGridRequest';
import { invalidateCache } from '../utils/apiCache';
import api from './api';

// GET users grid (cached 30s)
export async function getUsers({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'createdAt', desc: true }
} = {}) {
  return cachedGridGet('/api/v1/admin/users/grid', {
    page, size, filters, sort
  });
}

// GET user by id (direct GET endpoint exists)
export async function getUserById(userId) {
  const response = await api.get(`/api/v1/admin/users/${userId}`);
  return response.data ?? response;
}

// PATCH update user (admin) → invalidate cache
export async function adminUpdateUser(userId, payload) {
  const response = await api.patch(
    `/api/v1/admin/users/${userId}`,
    payload
  );
  invalidateCache('/api/v1/admin/users/grid');
  return response.data ?? response;
}

// PATCH block user → invalidate cache
export async function blockUser(userId) {
  const response = await api.patch(
    `/api/v1/admin/users/${userId}/block`
  );
  invalidateCache('/api/v1/admin/users/grid');
  return response.data ?? response;
}

// PATCH activate user → invalidate cache
export async function activateUser(userId) {
  const response = await api.patch(
    `/api/v1/admin/users/${userId}/activate`
  );
  invalidateCache('/api/v1/admin/users/grid');
  return response.data ?? response;
}
