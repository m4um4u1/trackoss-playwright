import { test, expect } from "@playwright/test";

test("should delete a cycling route", async ({ request }) => {
  // First create a route to delete
  const newRoute = {
    name: "Test Route",
    description: "A test cycling route",
    points: [{ latitude: 47.6062, longitude: -122.3321, elevation: 10 }],
  };

  const createResponse = await request.post(
    "api/routes",
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

  // Now delete the route
  const deleteResponse = await request.delete(`/api/routes/${routeId}`);

  expect(deleteResponse.status()).toBe(204);

  // Verify the route is deleted
  const getResponse = await request.get(`/api/routes/${routeId}`);
  expect(getResponse.status()).toBe(404);
});
