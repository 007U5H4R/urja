import { axeBuilder } from "./axe";
import { expect, test, type Page } from "./fixtures";

// TASK-25: the flag lab on a flagged trip's evidence page (#flag-lab), at 375 / 768 / 1440.
// More streams, more confidence; more confidence and a higher tier, more autonomy.

const lab = (page: Page) => page.locator("section#flag-lab");
const stepper = (page: Page) => lab(page).getByRole("slider", { name: "Streams added" });
const tier = (page: Page, name: string) => lab(page).getByRole("group", { name: "Tier" }).getByRole("button", { name, exact: true });
const nowWord = (page: Page) => lab(page).locator("[data-testid='fl-now'] .conf");
const level = (page: Page, id: string) => lab(page).locator(`li[data-level='${id}']`);

async function setStep(page: Page, n: number) {
  await stepper(page).fill(String(n));
  await expect(stepper(page)).toHaveValue(String(n));
}

async function noViolations(page: Page) {
  const { violations } = await axeBuilder(page).analyze();
  expect(violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

test("/trips/0926-04#flag-lab: visible after the fuel chart, before the timeline and ledger; prototype intro links to /bet", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/trips/0926-04#flag-lab");
  await expect(lab(page)).toBeVisible();
  await expect(lab(page).locator("h2#fl-h")).toHaveText("Flag lab");
  await expect(lab(page).locator(".fl-intro")).toContainText("A prototype of the SuprFleet bet");
  await expect(lab(page).getByRole("link", { name: "Read the bet" })).toHaveAttribute("href", "/bet");
  const order = await page.evaluate(() =>
    ["section.chartpanel", "section#flag-lab", "section.lower"].map((s) => document.querySelector(s)!.getBoundingClientRect().top),
  );
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  // The labelled assumptions stay visible, and the page still has a single h1.
  await expect(lab(page).locator(".fl-claims .bet-assume-tag").first()).toHaveText("Assumption");
  await expect(page.locator("h1")).toHaveCount(1);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("0926-04: the lab cites its sourced figures; every [n] points at an Unverified item in the lab's own Sources", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  await expect(lab(page).locator(".fl-claims > h3")).toHaveText("Sources and assumptions behind the lab");
  const sources = lab(page).getByRole("region", { name: "Sources" });
  await expect(sources).toHaveCount(1);
  const items = sources.getByRole("listitem");
  expect(await items.count()).toBeGreaterThan(0);
  await expect(items.filter({ hasText: "Unverified" })).toHaveCount(await items.count());
  // The CAN fuel step quotes "10–40 L steps", a sourced figure, so its source is listed.
  await expect(sources.locator("li#src-can-fuel-steps")).toHaveCount(1);
  await expect(lab(page).locator(".fl-claims .bet-claims li").filter({ hasText: "10–40 L" }).locator("a.cite-n")).toHaveAttribute(
    "href",
    "#src-can-fuel-steps",
  );
  const ids = await items.evaluateAll((lis) => lis.map((li) => li.id));
  const hrefs = await lab(page).locator("a.cite-n").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) expect(ids).toContain(href!.slice(1));
  // One Sources heading on the page, so its id is unique.
  await expect(page.locator("#bet-sources-h")).toHaveCount(1);
});

test("0926-04: stepping from the first stream to the last moves Check → Likely → High; the camera is simulated", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  // Opens on the flag card's own grade: step 4 of 5, High.
  await expect(stepper(page)).toHaveValue("4");
  await expect(nowWord(page)).toHaveText("High");
  const words: string[] = [];
  for (let n = 1; n <= 5; n++) {
    await setStep(page, n);
    words.push((await nowWord(page).textContent())!);
  }
  expect(words).toEqual(["Check", "Likely", "Likely", "High", "High"]);
  await expect(lab(page).locator("[data-testid='fl-now']")).toContainText("2 independent families");
  const camera = lab(page).locator("ol.fl-steplist > li").filter({ hasText: "Camera" });
  await expect(camera).toHaveCount(1);
  await expect(camera.locator(".chip")).toHaveText("Simulated");
});

test("0926-04: Autopilot on the last step unlocks the L4 auto-hold; Free unlocks only L1", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  await expect(tier(page, "Munshi")).toHaveAttribute("aria-pressed", "true");
  await tier(page, "Autopilot").click();
  await expect(tier(page, "Autopilot")).toHaveAttribute("aria-pressed", "true");
  const autoHold = level(page, "L4").getByRole("button", { name: /^Auto-hold driver advances above/ });
  await expect(autoHold).toBeDisabled();
  await setStep(page, 5);
  await expect(level(page, "L4")).toHaveAttribute("data-unlocked", "true");
  await expect(level(page, "L4").locator(".fl-lock")).toHaveText("Unlocked");
  await expect(autoHold).toBeEnabled();
  await expect(lab(page).locator("[data-testid='fl-announce']")).toHaveText(
    "Step 5 of 5: High, 2 independent families. Autopilot: L1 to L4 unlocked, 6 actions available.",
  );

  await tier(page, "Free").click();
  await expect(lab(page).locator("li[data-level][data-unlocked='true']")).toHaveCount(1);
  await expect(level(page, "L1")).toHaveAttribute("data-unlocked", "true");
  for (const id of ["L2", "L3", "L4"]) await expect(level(page, id).locator(".fl-lock")).toHaveText("Locked");
  await expect(level(page, "L5").locator(".fl-lock")).toHaveText("Future");
  await expect(level(page, "L2").getByRole("button", { name: "Hold the fuel card" })).toBeDisabled();
  await expect(level(page, "L2")).toContainText("Needs the Munshi tier.");
});

test("0926-04: an action shows the prototype note inline and sends no request", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));

  const note = level(page, "L2").locator("[data-testid='fl-note']");
  await expect(note).toHaveText("");
  await level(page, "L2").getByRole("button", { name: "Hold the fuel card" }).click();
  await expect(note).toHaveText(/^Prototype, simulated data\. Nothing was sent or changed: “Hold the fuel card”/);
  await tier(page, "Pro").click();
  await level(page, "L3").getByRole("button", { name: /diesel norm/ }).click();
  await expect(level(page, "L3").locator("[data-testid='fl-note']")).toHaveText(/^Prototype, simulated data\./);
  await setStep(page, 1);
  // Any request the clicks set off would start at once; give it a moment to show up, event-driven.
  const late = await page.waitForEvent("request", { timeout: 750 }).then((r) => r.url(), () => null);
  expect(late).toBeNull();
  expect(requests).toEqual([]);
});

test("0927-02: the bill-OCR step reaches High", async ({ page }) => {
  await page.goto("/trips/0927-02#flag-lab");
  await expect(lab(page)).toBeVisible();
  await setStep(page, 1);
  await expect(nowWord(page)).toHaveText("Check");
  await expect(lab(page).locator("[data-testid='fl-now']")).toContainText("No independent family yet");
  await setStep(page, 4);
  await expect(nowWord(page)).toHaveText("High");
  const ocr = lab(page).locator("ol.fl-steplist > li").filter({ hasText: "Bill OCR" });
  await expect(ocr.locator(".conf")).toHaveText("High");
  await expect(ocr.locator(".chip")).toHaveText("Simulated");
});

test("0926-11: every step stays at Check", async ({ page }) => {
  await page.goto("/trips/0926-11#flag-lab");
  const max = Number(await stepper(page).getAttribute("max"));
  expect(max).toBeGreaterThan(1);
  for (let n = 1; n <= max; n++) {
    await setStep(page, n);
    await expect(nowWord(page)).toHaveText("Check");
  }
  await expect(lab(page).locator("ol.fl-steplist > li .conf")).toHaveText(Array(max).fill("Check"));
});

test("a clean trip and a trip still on the road have no flag lab", async ({ page }) => {
  await page.goto("/trips/0927-05");
  await expect(page.locator("article.flagcard")).toHaveAttribute("data-rule", "clean");
  await expect(page.locator("#flag-lab")).toHaveCount(0);
  await page.goto("/trips/0928-01");
  await expect(page.locator("article.flagcard")).toHaveAttribute("data-rule", "live");
  await expect(page.locator("#flag-lab")).toHaveCount(0);
});

test("axe: no violations with the lab in its default state, and after changing step and tier", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  await page.waitForLoadState("networkidle");
  await noViolations(page);
  await setStep(page, 1);
  await tier(page, "Free").click();
  await noViolations(page);
  await setStep(page, 5);
  await tier(page, "Autopilot").click();
  await level(page, "L4").getByRole("button", { name: /^Auto-hold/ }).click();
  await noViolations(page);
});

test("keyboard only: reach and operate the stepper and the tier switch", async ({ page }) => {
  await page.goto("/trips/0926-04#flag-lab");
  await page.waitForLoadState("networkidle");
  // Start from the lab's intro link and tab forward.
  await lab(page).getByRole("link", { name: "Read the bet" }).focus();
  await page.keyboard.press("Tab");
  await expect(stepper(page)).toBeFocused();
  await page.keyboard.press("Home");
  await expect(stepper(page)).toHaveValue("1");
  await expect(nowWord(page)).toHaveText("Check");
  await page.keyboard.press("ArrowRight");
  await expect(nowWord(page)).toHaveText("Likely");
  await page.keyboard.press("End");
  await expect(stepper(page)).toHaveValue("5");
  await expect(nowWord(page)).toHaveText("High");

  await page.keyboard.press("Tab");
  await expect(tier(page, "Free")).toBeFocused();
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  await expect(tier(page, "Autopilot")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tier(page, "Autopilot")).toHaveAttribute("aria-pressed", "true");
  await expect(level(page, "L4").getByRole("button", { name: /^Auto-hold/ })).toBeEnabled();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Space");
  await expect(tier(page, "Pro")).toHaveAttribute("aria-pressed", "true");
});

for (const path of ["/trips/0926-04", "/trips/0927-02", "/trips/0926-11"]) {
  test(`no horizontal scroll on ${path} with the lab`, async ({ page }) => {
    await page.goto(`${path}#flag-lab`);
    await page.waitForLoadState("networkidle");
    await expect(lab(page)).toBeVisible();
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}

test("reflow: no sideways scroll with the text alone at 200%, and at 320 px on the phone", async ({ page }, info) => {
  await page.goto("/trips/0926-04#flag-lab");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  const overflow = () =>
    page.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      return [...document.querySelectorAll("#flag-lab *")].filter((e) => e.getBoundingClientRect().right > cw + 0.5).map((e) => e.className);
    });
  expect(await overflow()).toEqual([]);
  if (info.project.name !== "phone") return;
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await overflow()).toEqual([]);
});
