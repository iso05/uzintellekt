import { getCached, setCached } from './apiCache';
import api from '../services/api';

export async function cachedGridGet(endpoint, gridParams) {
  const cacheKey = `${endpoint}:${JSON.stringify(gridParams)}`;

  const cached = getCached(cacheKey);
  if (cached) {
    console.debug('[Cache HIT]', cacheKey);
    return cached;
  }

  console.debug('[Cache MISS]', cacheKey);

  const gridRequest = encodeURIComponent(JSON.stringify(gridParams));
  const url = `${endpoint}?gridRequest=${gridRequest}`;

  const response = await api.get(url);
  const data = response.data ?? response;

  setCached(cacheKey, data);

  return data;
}
