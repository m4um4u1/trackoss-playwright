import { test, expect } from "@playwright/test";

test("should get route by ID", async ({ request }) => {
  // First create a route to test with
  const newRoute = {
    name: "Test Route",
    description: "A test cycling route",
    points: [{ latitude: 47.6062, longitude: -122.3321, elevation: 10 }],
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

  // Now get the route by ID
  const getResponse = await request.get(`/api/routes/${routeId}`);

  expect(getResponse.status()).toBe(200);
  expect(getResponse.headers()["content-type"]).toContain("application/json");

  const body = await getResponse.json();
  expect(body.id).toBe(routeId);
  expect(body.name).toBe(newRoute.name);
  expect(body.description).toBe(newRoute.description);
});
