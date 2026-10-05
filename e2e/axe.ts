import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/**
 * Every axe check runs WCAG 2.0, 2.1 and 2.2 A/AA plus best practice (DES-4, TC-031). axe's default
 * run skips rules that are off by default, among them 2.2's `target-size` (2.5.8), which is how the
 * 19.5 px "Evidence" links passed. The tags cover every rule the default run enables (axe-core
 * 4.13: all of them carry a wcag2*, wcag21*, wcag22* or best-practice tag), so this only adds rules.
 */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

/** An AxeBuilder for `page` with AXE_TAGS; chain `.include()` etc. as before. */
export function axeBuilder(page: Page): AxeBuilder {
  return new AxeBuilder({ page }).withTags(AXE_TAGS);
}
