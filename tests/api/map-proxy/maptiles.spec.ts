import { test, expect } from '@playwright/test';

test('should proxy map style configuration', async ({ request }) => {
  const styleId = 'outdoor';
  const response = await request.get(`/api/map-proxy/${styleId}/style.json`);

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toBe('application/json');

  const body = await response.json();
  expect(body).toHaveProperty('version');
  expect(body).toHaveProperty('name');
  expect(body).toHaveProperty('sources');
  expect(body).toHaveProperty('layers');
});

test('should proxy map tiles', async ({ request }) => {
  const styleId = 'outdoor';
  const z = '10';
  const x = '163';
  const y = '357';
  const format = 'png';

  const response = await request.get(`/api/map-proxy/${styleId}/${z}/${x}/${y}.${format}`);

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\/(png|jpeg)$/);

  const body = await response.body();
  expect(body.length).toBeGreaterThan(0);
});
