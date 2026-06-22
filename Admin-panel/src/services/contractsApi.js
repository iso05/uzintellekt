import { cachedGridGet } from '../utils/cachedGridRequest';
import { invalidateCache } from '../utils/apiCache';
import api from './api';

// GET contracts grid (cached 30s)
export async function getContracts({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'signedAt', desc: true }
} = {}) {
  return cachedGridGet('/api/v1/contracts/grid', { page, size, filters, sort });
}

// GET download contract
export async function downloadContract(contractId) {
  const response = await api.get(`/api/v1/contracts/${contractId}/download`);
  return response.data ?? response;
}

// POST preview contract (NOT cached — always fresh PDF)
export async function previewContract(payload) {
  return api.post('/api/v1/contracts/preview', payload, {
    responseType: 'blob'
  });
}

// POST sign contract (NOT cached — mutation)
export async function signContract(formData) {
  const response = await api.post('/api/v1/contracts/sign', formData);
  invalidateCache('/api/v1/contracts/grid');
  return response.data ?? response;
}
