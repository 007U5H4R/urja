import { expect, test, type Page } from "./fixtures";

// TSK-02.8 · TKT-02 AC5 (TC-001, TC-021): Today's verdict and ledger bar come from the engine.

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** The mockup sets a typographic apostrophe and a no-break space before "trips". */
const plain = (s: string | null) => (s ?? "").replace(/’/g, "'").replace(/ /g, " ");

test("the verdict h1 and the ledger legend show yesterday's numbers, with no console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  const h1 = page.locator("h1.verdict");
  await expect(h1).toBeVisible();
  expect(plain(await h1.textContent())).toBe("Your trucks earned ₹1,86,400 yesterday. ₹11,430 of it doesn't add up, across 3 trips.");

  const bar = page.locator("section.ledgerbar");
  await expect(page.getByRole("img", { name: /^Yesterday's ledger/ })).toHaveAttribute(
    "aria-label",
    "Yesterday's ledger: freight billed ₹4,12,000; diesel ₹1,58,300; tolls ₹38,900; driver allowance and other ₹28,400; profit ₹1,86,400",
  );
  const amounts = await bar.locator(".legend b").allTextContents();
  expect(amounts).toEqual(["₹4,12,000", "₹1,58,300", "₹38,900", "₹28,400", "₹1,86,400"]);
  const widths = await bar.locator(".bar span").evaluateAll((els) => els.map((e) => (e as HTMLElement).style.width));
  expect(widths).toEqual(["38.4%", "9.4%", "6.9%", "45.3%"]);

  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("the page head shows the greeting and, above the phone breakpoint, the two tags", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.locator(".pagehead .greet")).toHaveText("Good morning, Sharma ji · Monday, 28 September");
  const tags = page.locator(".pagehead .controls .tag");
  await expect(tags).toHaveText(["Yesterday · Sun 27 Sep", "17 trips reconciled at 6:55 AM"]);
  // lamp.css hides the tags on phones.
  if (info.project.name === "phone") await expect(tags.first()).toBeHidden();
  else await expect(tags.first()).toBeVisible();
});

test("no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});
