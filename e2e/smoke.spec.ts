import { expect, test } from "@playwright/test";

test("home loads with a verdict h1 and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveClass(/\bverdict\b/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your trucks earned");
  await page.waitForLoadState("networkidle");

  expect(errors).toEqual([]);
});
