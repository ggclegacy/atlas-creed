import { expect, test } from "@playwright/test";

test("an unauthenticated visitor is sent to the private sign-in entry", async ({
  page,
}) => {
  await page.goto("/");

  await expect.poll(() => new URL(page.url()).pathname).toBe("/sign-in");
  await expect(
    page.getByRole("heading", { level: 1, name: "Enter the environment." }),
  ).toBeVisible();

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(background).not.toBe("");
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});

test("auth messaging does not disclose the configured owner", async ({
  page,
}) => {
  await page.goto("/sign-in/check-email");
  await expect(
    page.getByRole("heading", { name: "Check your email." }),
  ).toBeVisible();
  await expect(page.getByText(/if the address is authorized/i)).toBeVisible();
  await expect(page.getByText("owner@example.com")).toHaveCount(0);
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

  const signIn = await request.get("/sign-in");
  expect(signIn.headers()["x-frame-options"]).toBe("DENY");
  expect(signIn.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});

test("the sign-in surface fits a realistic phone viewport", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile ergonomics assertion");
  await page.goto("/sign-in");

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);

  const submit = await page
    .getByRole("button", { name: "Send secure link" })
    .boundingBox();
  expect(submit?.height).toBeGreaterThanOrEqual(44);
});
