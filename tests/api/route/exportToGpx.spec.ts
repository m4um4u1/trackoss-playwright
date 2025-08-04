import { test, expect } from "@playwright/test";

test("should export route as GPX file", async ({ request }) => {
  // First create a route to export
  const newRoute = {
    name: "Test Route",
    description: "A test cycling route",
    points: [
      { latitude: 47.6062, longitude: -122.3321, elevation: 10 },
      { latitude: 47.6162, longitude: -122.3421, elevation: 15 },
    ],
  };

  const createResponse = await request.post(
    "/api/routes",
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

  // Now export the route as GPX
  const exportResponse = await request.get(`/api/routes/${routeId}/export/gpx`);

  expect(exportResponse.status()).toBe(200);
  expect(exportResponse.headers()["content-type"]).toContain("application/xml");
  expect(exportResponse.headers()["content-disposition"]).toContain(
    "attachment",
  );
  expect(exportResponse.headers()["content-disposition"]).toContain(".gpx");

  const body = await exportResponse.text();
  expect(body).toContain("<gpx");
  expect(body).toContain("</gpx>");
  expect(body).toContain("<trk>");
  expect(body).toContain("</trk>");
});
