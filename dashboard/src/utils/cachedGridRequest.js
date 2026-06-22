import { getCached, setCached } from './apiCache';
import { request } from '../services/api';

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

  const response = await request(url, { method: 'GET' });
  
  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = response;
  }

  setCached(cacheKey, data);

  return data;
}
