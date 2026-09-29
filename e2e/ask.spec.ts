import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "./fixtures";

// TSK-12.4 · TKT-12 (TC-026, TC-024 Ask, TC-031): the ⌘K drawer at 1440/768 and the
// phone dock + chat view at 375. /api/ask is mocked with page.route, so no key is needed.

const SCOPE = "212 trips across 24 trucks, 1–27 Sep";
const PROV = { scope: "", model: "gemini-3.5-flash", ms: 1800, promptVersion: "ask-v1", datasetHash: "h" };
const MODEL = {
  mode: "model",
  answer: "Anil Bairwa's trips on RJ14 GC 3309 used 125 L more diesel than normal.",
  lang: "en",
  cites: [
    { tripId: "0926-04", label: "RJ14 GB 4521 · Jaipur → Okhla, Delhi" },
    { tripId: "0926-11", label: "RJ14 GC 3309 · Jaipur → Bhiwandi" },
  ],
  caveat: "Check the trips before acting",
  provenance: PROV,
};
const FALLBACK = {
  mode: "fallback",
  answer: "21–27 Sep: 217 L diesel unaccounted on 5 trips.",
  lang: "en",
  cites: [{ tripId: "0926-04", label: "RJ14 GB 4521 · Jaipur → Okhla, Delhi" }],
  provenance: { ...PROV, model: null, ms: 40 },
};
const SAVED_EN = "Your question is saved. Try again in a minute for a written answer.";
const SAVED = { mode: "saved", answer: SAVED_EN, lang: "en", cites: [], provenance: { ...PROV, model: null, ms: 30 } };
const BANNER = "Urja’s AI couldn’t answer right now, so here is the number straight from your data.";

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Answers /api/ask with `body` and records every question sent. */
async function mockAsk(page: Page, body: unknown, status = 200): Promise<{ question: string; lang?: string }[]> {
  const sent: { question: string; lang?: string }[] = [];
  await page.route("**/api/ask", async (route: Route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return sent;
}

const drawer = (page: Page) => page.getByRole("dialog", { name: "Ask Urja" });
const input = (page: Page) => drawer(page).getByRole("textbox", { name: "Your question" });

/** ⌘K / Ctrl+K until hydration has attached the listener. */
async function openWithShortcut(page: Page) {
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(drawer(page)).toBeVisible({ timeout: 500 });
  }).toPass();
}

/** Waits for the 240 ms slide to finish (transform back to none). */
async function settled(page: Page) {
  await expect.poll(() => page.locator("#ask-drawer").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
}

async function ask(page: Page, q: string) {
  await input(page).fill(q);
  await input(page).press("Enter");
}

test.describe("desktop and tablet: the ⌘K drawer (TC-026)", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === "phone", "keyboard shortcut and top-bar trigger: pointer: fine");
  });

  test("⌘K/Ctrl+K opens with focus in the input; Tab stays inside; main is inert; Esc closes and focus returns to the trigger", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await openWithShortcut(page);
    await expect(input(page)).toBeFocused();
    await expect(page.locator("main")).toHaveAttribute("inert", "");
    await expect(page.locator("header.topbar")).toHaveAttribute("inert", "");

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#ask-drawer"))).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#ask-drawer"))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
    await expect(page.locator("#askBtn")).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert", "");
    expect(errors).toEqual([]);
  });

  test("the top-bar trigger opens it, the scrim closes it, and focus returns to the trigger", async ({ page }) => {
    await page.goto("/");
    const trigger = page.locator("#askBtn");
    await expect(async () => {
      await trigger.click();
      await expect(drawer(page)).toBeVisible({ timeout: 500 });
    }).toPass();
    await expect(input(page)).toBeFocused();
    await page.mouse.click(10, 400);
    await expect(drawer(page)).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("the drawer sits on the right edge at 460 px and slides in over 240 ms", async ({ page }, info) => {
    await page.goto("/");
    await openWithShortcut(page);
    const anim = await page.locator("#ask-drawer").evaluate((el) => {
      const s = getComputedStyle(el);
      return { name: s.animationName, duration: s.animationDuration, easing: s.animationTimingFunction };
    });
    expect(anim).toEqual({ name: "ask-drawer-in", duration: "0.24s", easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    expect(await page.locator(".scrim").evaluate((el) => getComputedStyle(el).animationDuration)).toBe("0.18s");
    await settled(page);
    const box = (await drawer(page).boundingBox())!;
    const vw = page.viewportSize()!.width;
    expect(box.width).toBe(460);
    expect(Math.round(box.x + box.width)).toBe(vw);
    expect(box.height).toBe(page.viewportSize()!.height);
    expect(info.project.name === "desktop" ? vw : 1440).toBe(1440);
  });

  test("reduced motion: no slide", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await openWithShortcut(page);
    expect(await page.locator("#ask-drawer").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    await page.keyboard.press("Escape");
    // Without an exit animation Radix unmounts at once.
    await expect(page.locator("#ask-drawer")).toHaveCount(0, { timeout: 100 });
  });

  test("/?ask opens the drawer with focus in the input, and drops the param", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/?ask");
    await expect(drawer(page)).toBeVisible();
    await expect(input(page)).toBeFocused();
    await expect(page).toHaveURL(/\/$/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#askBtn")).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("works from other routes too (the trip page)", async ({ page }) => {
    await page.goto("/trips/0926-04");
    await openWithShortcut(page);
    await expect(input(page)).toBeFocused();
  });
});

test.describe("Ask states (TC-024)", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === "phone", "the phone path is covered below");
  });

  test("idle shows the three chips, and a chip sends its question", async ({ page }) => {
    const sent = await mockAsk(page, MODEL);
    await page.goto("/");
    await openWithShortcut(page);
    const chips = drawer(page).getByRole("group", { name: "Suggested questions" }).getByRole("button");
    await expect(chips).toHaveText([
      "Which truck earns least per km, and why?",
      "पिछले हफ़्ते कितना डीज़ल गायब हुआ?",
      "Show every flag on the Behror stretch",
    ]);
    await chips.nth(1).click();
    await expect(drawer(page).locator(".q")).toHaveText("पिछले हफ़्ते कितना डीज़ल गायब हुआ?");
    expect(sent).toEqual([{ question: "पिछले हफ़्ते कितना डीज़ल गायब हुआ?" }]);
  });

  test("answering, then the answer with cite chips, the caveat and the provenance line; a cite opens its trip", async ({ page }) => {
    const errors = collectErrors(page);
    let release: () => void = () => {};
    const held = new Promise<void>((r) => (release = r));
    await page.route("**/api/ask", async (route) => {
      await held;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MODEL) });
    });
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "Which driver cost me the most diesel this month?");
    await expect(drawer(page).getByText("Asking Gemini…")).toBeVisible();
    release();

    const a = drawer(page).locator(".a");
    await expect(a.locator("p").first()).toHaveText(MODEL.answer);
    await expect(a.getByRole("link", { name: "Trip 0926-04" })).toHaveAttribute("href", "/trips/0926-04");
    await expect(a.getByRole("link", { name: "Trip 0926-11" })).toHaveAttribute("href", "/trips/0926-11");
    await expect(a.locator("li").first()).toContainText("RJ14 GB 4521 · Jaipur → Okhla, Delhi");
    await expect(a.locator(".muted")).toHaveText("Check the trips before acting");
    // The scope comes from the layout's server-side data (the mock sends none).
    await expect(a.locator(".prov")).toHaveText(
      `From ${SCOPE} · Gemini 3.5 Flash · answered in 1.8 s · Urja can be wrong, so open the trips before acting.`,
    );
    await expect(input(page)).toHaveValue("");

    const axe = await new AxeBuilder({ page }).include("#ask-drawer").analyze();
    const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);

    await a.getByRole("link", { name: "Trip 0926-04" }).click();
    await expect(page).toHaveURL(/\/trips\/0926-04$/);
    await expect(drawer(page)).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("a <script> in the answer renders as text", async ({ page }) => {
    const evil = "<script>window.__pwned=1</script><img src=x onerror=window.__pwned=2>";
    await mockAsk(page, { ...MODEL, answer: evil });
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "q");
    await expect(drawer(page).locator(".a p").first()).toHaveText(evil);
    expect(await drawer(page).locator("script, img").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  });

  test("fallback: the banner, the report with cites, 'Your question is saved' and Try again; the question stays in the box", async ({ page }) => {
    const errors = collectErrors(page);
    const sent = await mockAsk(page, FALLBACK);
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "How much diesel went missing last week?");
    await expect(drawer(page).getByRole("heading", { level: 3 })).toHaveText(BANNER);
    const box = drawer(page).locator(".fallback");
    await expect(box.locator(".ans")).toHaveText(FALLBACK.answer);
    await expect(box.getByRole("link", { name: "Trip 0926-04" })).toHaveAttribute("href", "/trips/0926-04");
    await expect(box.locator(".saved")).toHaveText(SAVED_EN);
    await expect(drawer(page).locator(".prov")).toContainText("straight from your data, no AI · answered in 0.04 s");
    await expect(input(page)).toHaveValue("How much diesel went missing last week?");

    const axe = await new AxeBuilder({ page }).include("#ask-drawer").analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);

    await drawer(page).getByRole("button", { name: "Try again" }).click();
    await expect.poll(() => sent.length).toBe(2);
    expect(sent[1]).toEqual({ question: "How much diesel went missing last week?" });
    expect(errors).toEqual([]);
  });

  test("saved: the saved message, Try again, and the question kept for the retry", async ({ page }) => {
    await mockAsk(page, SAVED);
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "Will it rain in Behror tomorrow?");
    await expect(drawer(page).getByRole("heading", { level: 3 })).toHaveText("Urja’s AI couldn’t answer right now.");
    await expect(drawer(page).locator(".fallback .ans")).toHaveText(SAVED_EN);
    await expect(drawer(page).getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(input(page)).toHaveValue("Will it rain in Behror tomorrow?");
  });

  test("429: when to ask again, with the fallback it carries", async ({ page }) => {
    await mockAsk(page, { ...FALLBACK, retryAfterS: 12 }, 429);
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "q");
    await expect(drawer(page).getByText("Ask again in 12 s.")).toBeVisible();
    await expect(drawer(page).getByRole("heading", { level: 3 })).toHaveText(BANNER);
  });

  test("error: says what happened, keeps the question, and Try again recovers", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/ask", async (route) => {
      calls++;
      if (calls === 1) return route.abort("failed");
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MODEL) });
    });
    await page.goto("/");
    await openWithShortcut(page);
    await ask(page, "Which truck earns least?");
    await expect(drawer(page).locator('.fallback[data-mode="error"]')).toContainText("Urja couldn’t reach its server");
    await expect(input(page)).toHaveValue("Which truck earns least?");
    await drawer(page).getByRole("button", { name: "Try again" }).click();
    await expect(drawer(page).locator(".a p").first()).toHaveText(MODEL.answer);
  });
});

test.describe("phone at 375: the dock and the chat view", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "phone", "phone only");
  });

  test("the brief's dock asks the same hook and opens the full-height chat view", async ({ page }) => {
    const errors = collectErrors(page);
    const sent = await mockAsk(page, MODEL);
    await page.goto("/brief");
    const dock = page.locator(".dock");
    const dockInput = dock.getByRole("textbox");
    await page.waitForLoadState("networkidle");
    await expect(async () => {
      await dockInput.fill("सबसे कम कौन कमाता है?");
      await dockInput.press("Enter");
      await expect(drawer(page)).toBeVisible({ timeout: 500 });
    }).toPass();
    expect(sent[0]).toEqual({ question: "सबसे कम कौन कमाता है?", lang: "hi" });
    await expect(drawer(page).locator(".q")).toHaveText("सबसे कम कौन कमाता है?");
    await expect(drawer(page).locator(".a p").first()).toHaveText(MODEL.answer);
    await settled(page);
    const box = (await drawer(page).boundingBox())!;
    expect(box).toEqual({ x: 0, y: 0, width: 375, height: 812 });
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);

    const axe = await new AxeBuilder({ page }).include("#ask-drawer").analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);

    await drawer(page).getByRole("button", { name: "Close Ask Urja" }).click();
    await expect(drawer(page)).toBeHidden();
    await expect(dockInput).toBeFocused();
    expect(errors).toEqual([]);
  });

  for (const path of ["/brief", "/message", "/"]) {
    test(`the menu's "Ask Urja" opens the chat view on ${path}, and Esc returns to the menu`, async ({ page }) => {
      const errors = collectErrors(page);
      await mockAsk(page, MODEL);
      await page.goto(path);
      // A click before hydration would follow the link's no-JS href (/?ask).
      await page.waitForLoadState("networkidle");
      const menu = page.locator("details.m-menu:visible");
      await expect(async () => {
        await menu.locator("summary").click();
        await menu.getByRole("link", { name: "Ask Urja" }).click();
        await expect(drawer(page)).toBeVisible({ timeout: 500 });
      }).toPass();
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}(\\?.*)?$`));
      await expect(input(page)).toBeFocused();
      await settled(page);
      expect((await drawer(page).boundingBox())!.width).toBe(375);
      await ask(page, "Which truck?");
      await expect(drawer(page).locator(".a .prov")).toContainText("Urja can be wrong");
      await page.keyboard.press("Escape");
      await expect(drawer(page)).toBeHidden();
      await expect(menu.locator("summary")).toBeFocused();
      expect(errors).toEqual([]);
    });
  }
});
