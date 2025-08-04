import { test, expect } from '@playwright/test';

test('should find routes nearby a location', async ({ request }) => {
  const latitude = 47.6062;
  const longitude = -122.3321;
  const radiusKm = 10.0;

  const response = await request.get(`/api/routes/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}`);

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('application/json');

  const body = await response.json();
  expect(body).toHaveProperty('content');
  expect(body).toHaveProperty('totalElements');
  expect(body).toHaveProperty('totalPages');
  expect(Array.isArray(body.content)).toBe(true);
});
