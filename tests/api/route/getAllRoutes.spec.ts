import { test, expect } from '@playwright/test';

test('should get all routes with pagination', async ({ request }) => {
  const response = await request.get('/api/routes');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('application/json');

  const body = await response.json();
  expect(body).toHaveProperty('content');
  expect(body).toHaveProperty('totalElements');
  expect(body).toHaveProperty('totalPages');
  expect(Array.isArray(body.content)).toBe(true);
});
