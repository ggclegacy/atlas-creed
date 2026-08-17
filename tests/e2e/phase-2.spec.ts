import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const SESSION_TOKEN = "atlas-ci-owner-session";

async function authenticateOwner(context: BrowserContext) {
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: SESSION_TOKEN,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      expires: Math.floor(Date.now() / 1_000) + 3_600,
    },
  ]);
}

async function send(page: Page, text: string) {
  const composer = page.getByRole("textbox", { name: "Message Atlas" });
  await composer.fill(text);
  await composer.press(
    process.platform === "darwin" ? "Meta+Enter" : "Control+Enter",
  );
}

test("unauthorized visitors see magic-link access and cannot call the model route", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Enter the environment." }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Email address" }),
  ).toBeVisible();

  const response = await request.post("/api/conversations/turns", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { clientTurnId: crypto.randomUUID(), text: "unauthorized" },
  });
  expect(response.status()).toBe(401);

  for (const privatePath of [
    "/brain",
    "/settings",
    `/c/${crypto.randomUUID()}`,
  ]) {
    const direct = await request.get(privatePath, { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(direct.status());
    expect(direct.headers().location).toContain("/sign-in");
  }
});

test("owner streams, reloads, continues context, and receives a generated title", async ({
  context,
  page,
  isMobile,
}) => {
  await authenticateOwner(context);
  await page.goto("/");
  await expect(page.getByText("What are we thinking through?")).toBeVisible();

  const first = `First Phase 2 thought ${crypto.randomUUID()}`;
  await send(page, first);
  await expect(page.getByText(first)).toBeVisible();
  await expect(
    page.getByText("Atlas is live. Context messages: 1."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/);
  const persistedUrl = page.url();

  await page.reload();
  await expect(page.getByText(first)).toBeVisible();
  await expect(
    page.getByText("Atlas is live. Context messages: 1."),
  ).toBeVisible();

  await send(page, "Continue using the context already supplied.");
  await expect(
    page.getByText("Atlas is live. Context messages: 3."),
  ).toBeVisible();
  expect(page.url()).toBe(persistedUrl);

  await page.reload();
  await page
    .getByRole("button", {
      name: isMobile ? "Open navigation" : "Conversation history",
    })
    .click();
  await expect(
    page.getByRole("link", { name: /Atlas Live Context/ }).first(),
  ).toBeVisible();
});

test("Stop aborts a long stream and the interrupted partial survives reload", async ({
  context,
  page,
}) => {
  await authenticateOwner(context);
  await page.goto("/");
  await send(page, `Give me a long response ${crypto.randomUUID()}`);
  await expect(
    page.getByText(/deliberately long fixture response/).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop generation" }).click();
  await expect(page.getByText("Interrupted")).toBeVisible();
  await page.waitForTimeout(750);
  await page.reload();
  await expect(
    page.getByText(/deliberately long fixture response/).first(),
  ).toBeVisible();
  await expect(page.getByText("Interrupted")).toBeVisible();
});

test("authenticated settings, PWA, and security headers are present", async ({
  context,
  page,
  request,
}) => {
  await authenticateOwner(context);
  const settingsResponse = await page.goto("/settings");
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings" }),
  ).toBeVisible();
  expect(settingsResponse?.headers()["cache-control"] ?? "").toMatch(
    /private|no-store/,
  );
  await expect(page.getByText("Email magic link")).toBeVisible();
  await expect(page.getByText("gpt-5.6-sol")).toBeVisible();

  const session = await context.request.get("/api/auth/session");
  expect(session.ok()).toBe(true);
  expect(await session.json()).toMatchObject({
    user: { email: "owner@example.com" },
  });
  const rejectedOrigin = await context.request.post(
    "/api/conversations/turns",
    {
      headers: { Origin: "https://attacker.invalid" },
      data: { clientTurnId: crypto.randomUUID(), text: "reject this origin" },
    },
  );
  expect(rejectedOrigin.status()).toBe(403);

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  expect(await manifest.json()).toMatchObject({ display: "standalone" });
  const worker = await request.get("/sw.js");
  expect(await worker.text()).toContain(
    "Private HTML and RSC responses are network-only",
  );
  const signIn = await request.get("/sign-in");
  expect(signIn.headers()["x-frame-options"]).toBe("DENY");
  expect(signIn.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});

test("owner initializes F1 and inspects the compiled constitutional trace", async ({
  context,
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    "the protected bootstrap runs once for the shared fixture",
  );
  await authenticateOwner(context);
  await page.goto("/brain");
  await expect(
    page.getByRole("heading", { level: 1, name: "Brain" }),
  ).toBeVisible();
  const initialization = page.getByLabel("INITIALIZE ATLAS CONSTITUTION 1.0");
  if (await initialization.isVisible()) {
    await initialization.fill("INITIALIZE ATLAS CONSTITUTION 1.0");
    await page
      .getByRole("button", { name: "Initialize constitutional foundation" })
      .click();
  }
  await expect(
    page.getByText("atlas-001: The Creator", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Long-term governed memory/)).toBeVisible();

  await page.goto("/");
  await send(page, "What is the current Gent Dispatch software priority?");
  await expect(
    page.getByText(/Atlas is live\. Context messages:/),
  ).toBeVisible();

  await page.goto("/brain");
  await expect(page.getByText("openai / gpt-5.6-sol").first()).toBeVisible();
  await expect(page.getByText(/Gent Dispatch software priority/)).toBeVisible();
  await expect(
    page.getByText(/Included · Gent Dispatch software priority/),
  ).toBeVisible();
});

test("mobile conversation controls fit and remain thumb sized", async ({
  context,
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile ergonomics assertion");
  await authenticateOwner(context);
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
  const menu = await page
    .getByRole("button", { name: "Open navigation" })
    .boundingBox();
  const sendButton = await page
    .getByRole("button", { name: "Send message" })
    .boundingBox();
  expect(menu?.height).toBeGreaterThanOrEqual(44);
  expect(sendButton?.height).toBeGreaterThanOrEqual(44);
});
