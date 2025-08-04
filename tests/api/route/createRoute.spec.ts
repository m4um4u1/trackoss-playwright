import { test, expect } from "@playwright/test";

test("should create a new cycling route", async ({ request }): Promise<void> => {
  const newRoute = {
    name: "Test Route",
    description: "A test cycling route",
    points: [
      { latitude: 47.6062, longitude: -122.3321, elevation: 10 },
      { latitude: 47.6162, longitude: -122.3421, elevation: 15 },
    ],
  };

  const response = await request.post("/api/routes", {
    data: newRoute,
    headers: {
      "Content-Type": "application/json",
    },
  });

  expect(response.status()).toBe(201);
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();
  expect(body).toHaveProperty("id");
  expect(body.name).toBe(newRoute.name);
  expect(body.description).toBe(newRoute.description);
});
