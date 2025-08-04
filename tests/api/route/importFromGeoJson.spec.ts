import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

test("should import route from GeoJSON file", async ({ request }) => {
  // Read a sample GeoJSON file
  const geoJsonFilePath = join(
      __dirname,
      "..",
      "..",
      "..",
      "samples",
      "sample.geojson",
  );
  const geoJsonFile = readFileSync(geoJsonFilePath);

  // Create FormData
  const formData = new FormData();
  formData.append(
      "file",
      new File([geoJsonFile], "sample.geojson", { type: "application/json" }),
  );

  // Send the request
  const response = await request.post("/api/routes/import/geojson", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
  });

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