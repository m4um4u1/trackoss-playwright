# TrackOSS Playwright Tests

This repository contains Playwright tests for the TrackOSS project.

## Setup

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

You can configure different base URLs for UI and API tests using environment variables. The project includes a template file:

- `.env.example` - Environment configuration template

To set up your environment:
1. Copy the template to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file with your specific URLs

You can also create custom environment files following the same pattern.

### Running Tests

Run all tests:
```bash
npm test
```

Run specific test types:
```bash
# Run only UI tests
npx playwright test --project=ui-*

# Run only API tests
npx playwright test --project=api
```

Or use Playwright directly for all tests:
```bash
npx playwright test
```

## Browser Support

Currently, tests are configured to run on Firefox only. To enable Chromium and WebKit browsers, you need to install additional system dependencies.

### Ubuntu/Debian

For Chromium and WebKit support, install these packages:
```bash
sudo apt-get update
sudo apt-get install -y \
  libicu66 \
  libxml2 \
  libwebp6 \
  libffi7
```

### Other Linux Distributions

Install equivalent packages for your distribution:
- libicu (International Components for Unicode)
- libxml2 (XML parsing library)
- libwebp (WebP image format library)
- libffi (Foreign Function Interface library)

### macOS

On macOS, you typically won't need additional dependencies as they're included with the system.

## Project Structure

- `tests/` - Contains test directories
  - `ui/` - UI tests using browser automation
  - `api/` - API tests using HTTP requests
- `playwright.config.ts` - Playwright configuration
- `package.json` - Project dependencies and scripts

## Writing Tests

### UI Tests

UI tests use browser automation to test web interfaces:

```javascript
const { test, expect } = require('@playwright/test');

test('UI test example', async ({ page }) => {
  await page.goto('/'); // Uses the UI base URL
  await expect(page).toHaveTitle(/Your App/);
});
```

### API Tests

API tests use HTTP requests to test backend endpoints:

```javascript
const { test, expect } = require('@playwright/test');

test('API test example', async ({ request }) => {
  const response = await request.get('/endpoint'); // Uses the API base URL
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toHaveProperty('data');
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)