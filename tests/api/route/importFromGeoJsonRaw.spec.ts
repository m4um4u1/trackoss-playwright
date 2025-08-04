import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

test("should import route from raw GeoJSON data", async ({ request }) => {
  // Read a sample GeoJSON file
  const geoJsonFilePath = join(
    __dirname,
    "..",
    "..",
    "..",
    "samples",
    "sample.geojson",
  );
  const geoJsonData = readFileSync(geoJsonFilePath, "utf-8");

  const response = await request.post('/api/routes/import/geojson/raw', {
      data: geoJsonData,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  expect(response.status()).toBe(201);
  expect(response.headers()["content-type"]).toContain("application/json");

  const body = await response.json();
  expect(body).toHaveProperty("id");
  expect(body).toHaveProperty("name");
  expect(body).toHaveProperty("description");
  expect(body).toHaveProperty("points");
  expect(Array.isArray(body.points)).toBe(true);
  expect(body.points.length).toBeGreaterThan(0);
});
