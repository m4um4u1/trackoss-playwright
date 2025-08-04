import { test } from "@playwright/test";
import { writeFile } from "fs/promises";
import { join } from "path";

test("should create sample GPX and GeoJSON files", async ({}) => {
  // Sample GPX content
  const outputDir = join(__dirname, "..", "..", "..", "samples");
  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="47.6062" lon="-122.3321">
        <ele>10</ele>
        <time>2023-01-01T12:00:00Z</time>
      </trkpt>
      <trkpt lat="47.6162" lon="-122.3421">
        <ele>15</ele>
        <time>2023-01-01T12:01:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  // Sample GeoJSON content
  const geoJsonContent = `{
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-122.3321, 47.6062, 10],
            [-122.3421, 47.6162, 15]
          ]
        },
        "properties": {
          "name": "Test Route",
          "description": "A test cycling route"
        }
      }
    ]
  }`;

  // Write files
  await writeFile(join(outputDir, "sample.gpx"), gpxContent);
  await writeFile(join(outputDir, "sample.geojson"), geoJsonContent);
});
