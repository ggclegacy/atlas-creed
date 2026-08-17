import { expect, test } from "@playwright/test";

/**
 * Phase 0 E2E: exactly one smoke test.
 *
 * Its only job is to prove the harness runs against a real production build —
 * that Playwright, the Next build, and the token pipeline actually work
 * together. Build Plan Phase 0 explicitly forbids manufacturing E2E coverage
 * for features that do not exist yet.
 *
 * Real flows (sign-in, streaming, interrupt, memory) arrive in Phases 1–2.
 */
test("the application boots and renders with tokens applied", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("phase-marker")).toContainText("Phase 0");
  await expect(
    page.getByRole("heading", { level: 1, name: /Atlas Creed/i }),
  ).toBeVisible();

  // The semantic token layer must resolve to a real value, not an empty string.
  // A broken token pipeline would still render text, so assert the computed
  // background rather than trusting the page to look right.
  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  expect(background).not.toBe("");
  expect(background).not.toBe("rgba(0, 0, 0, 0)");
});
