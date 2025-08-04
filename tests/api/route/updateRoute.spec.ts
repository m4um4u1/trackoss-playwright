import { test, expect } from "@playwright/test";

test("should update an existing cycling route", async ({ request }) => {
  // First create a route to update
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

  // Now update the route
  const updatedRoute = {
    ...newRoute,
    name: "Updated Test Route",
    description: "An updated test cycling route",
    points: [
      ...newRoute.points,
      { latitude: 47.6162, longitude: -122.3421, elevation: 15 },
    ],
  };

  const updateResponse = await request.put(
    `/api/routes/${routeId}`,
    {
      data: updatedRoute,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  expect(updateResponse.status()).toBe(200);
  expect(updateResponse.headers()["content-type"]).toContain("application/json");

  const body = await updateResponse.json();
  expect(body.id).toBe(routeId);
  expect(body.name).toBe(updatedRoute.name);
  expect(body.description).toBe(updatedRoute.description);
  expect(body.points.length).toBe(updatedRoute.points.length);
});
