import { test, expect } from "@playwright/test";

test("should export route as GeoJSON", async ({ request }) => {
  // First create a route to export
  const newRoute = {
    name: "Test Route",
    description: "A test cycling route",
    points: [
      { latitude: 47.6062, longitude: -122.3321, elevation: 10 },
      { latitude: 47.6162, longitude: -122.3421, elevation: 15 },
    ],
  };

  const createResponse = await request.post("/api/routes",
    {
      data: newRoute,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  expect(createResponse.status()).toBe(201);
  const createdRoute = await createResponse.json();
  const routeId = createdRoute.id;

  // Now export the route as GeoJSON
  const exportResponse = await request.get(`/api/routes/${routeId}/export/geojson`);

  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()["content-type"]).toContain(
    "application/json",
  );
  expect(exportResponse.headers()["content-disposition"]).toContain(
    "attachment",
  );
  expect(exportResponse.headers()["content-disposition"]).toContain(".geojson");

  const body = await exportResponse.json();
  expect(body).toHaveProperty("type", "FeatureCollection");
  expect(body).toHaveProperty("features");
  expect(Array.isArray(body.features)).toBe(true);
  expect(body.features.length).toBeGreaterThan(0);
});
