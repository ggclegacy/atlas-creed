import { expect, test } from "@playwright/test";

test("the Phase 1 shell is available without authentication", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Atlas is here." }),
  ).toBeVisible();

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(background).not.toBe("");
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});

test("settings reports direct-access mode", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
  await expect(page.getByText("Direct access")).toBeVisible();
  await expect(page.getByText("Not configured")).toBeVisible();
});

test("PWA and security assets are served with production headers", async ({
  request,
}) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const manifestBody: unknown = await manifest.json();
  expect(manifestBody).toMatchObject({ display: "standalone" });

  const icon = await request.get("/icon-maskable-512.png");
  expect(icon.ok()).toBe(true);

  const shell = await request.get("/");
  expect(shell.headers()["x-frame-options"]).toBe("DENY");
  expect(shell.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});

test("the direct-access shell fits a realistic phone viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile ergonomics assertion");
  await page.goto("/");

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);

  const menu = await page
    .getByRole("button", { name: "Open navigation" })
    .boundingBox();
  expect(menu?.height).toBeGreaterThanOrEqual(44);
});
