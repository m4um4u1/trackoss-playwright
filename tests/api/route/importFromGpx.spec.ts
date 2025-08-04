import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

test("should import route from GPX file", async ({ request }) => {
  // Read a sample GPX file
  const gpxFilePath = join(
      __dirname,
      "..",
      "..",
      "..",
      "samples",
      "sample.gpx",
  );
  const gpxFile = readFileSync(gpxFilePath);

  // Create FormData
  const formData = new FormData();
  formData.append(
      "file",
      new File([gpxFile], "sample.gpx", { type: "application/xml" }),
  );

  // Send the request
  const response = await request.post("/api/routes/import/gpx", {
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