import { test, expect, type Page } from "@playwright/test";
async function seek(page: Page, selector: string, progress: number) {
  await page.locator(selector).evaluate((element, p) => {
    const top = scrollY + element.getBoundingClientRect().top;
    window.scrollTo({
      top: top + (element.getBoundingClientRect().height - innerHeight) * p,
      behavior: "instant",
    });
  }, progress);
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(selector)
          .evaluate((e) => getComputedStyle(e).getPropertyValue("--progress")),
      ),
    )
    .toBeCloseTo(progress, 1);
}
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`scroll choreography is continuous and reversible at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/preview");
    await page.getByRole("button", { name: "Open Tasneem" }).waitFor();
    await expect
      .poll(async () =>
        page
          .locator(".envelope-portrait")
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(async () =>
        page
          .locator(".seal img")
          .evaluate((image) => (image as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      await page
        .locator(".envelope-portrait")
        .evaluate((image) => (image as HTMLImageElement).currentSrc),
    ).toContain(
      viewport.width <= 640
        ? "envelope-paper-mobile.webp"
        : "envelope-paper.webp",
    );

    await page.screenshot({
      path: `test-results/orange-envelope-${viewport.width}.png`,
    });
    await page.getByRole("button", { name: "Open Tasneem" }).click();
    await expect(page.locator("#unfold-cue")).toBeFocused();
    await expect(page.locator(".opening-chapter")).toHaveClass(/is-open/);
    for (const photo of await page.locator(".fan-print img").all()) {
      await expect
        .poll(() => photo.evaluate((e) => (e as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(page.locator(".fan-note")).toHaveCSS("opacity", "1");
    const zoomed = await page.locator(".envelope").boundingBox();
    expect(zoomed!.width).toBeGreaterThan(viewport.width);
    expect(zoomed!.height).toBeGreaterThan(viewport.height);
    await page.screenshot({
      path: `test-results/opened-envelope-${viewport.width}.png`,
    });
    await seek(page, ".opening-chapter", 0.4);
    await page.screenshot({
      path: `test-results/paper-emerging-${viewport.width}.png`,
    });
    await seek(page, ".opening-chapter", 0.9);
    await expect(page.locator(".welcome-frame h1")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: `test-results/unfolded-invitation-${viewport.width}.png`,
    });
    await seek(page, ".opening-chapter", 0.25);
    await expect(page.locator(".welcome-frame h1")).toHaveCSS("opacity", "0");
    await seek(page, ".vow-chapter", 0.85);
    await expect(page.locator(".vow-bottom")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: `test-results/scroll-vow-${viewport.width}.png`,
    });
    await seek(page, ".date-chapter", 0.85);
    await page.screenshot({
      path: `test-results/scroll-date-${viewport.width}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Native page links must retain the personalized route, not follow base href="/".
    await page.getByRole("link", { name: "RSVP", exact: true }).click();
    await expect(page).toHaveURL(/\/preview#rsvp$/);
    await expect(page.getByLabel("Joyfully accept")).toBeVisible();
  });
}
test("reduced motion has no scroll runway or invisible content", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview");
  await page.getByRole("button", { name: "Open Tasneem" }).click();
  await expect(page.locator("#welcome-heading")).toBeFocused();
  await expect(page.locator(".welcome-frame h1")).toHaveCSS("opacity", "1");
  const height = await page
    .locator(".opening-chapter")
    .evaluate((e) => e.getBoundingClientRect().height);
  expect(height).toBeLessThan(1500);
  await expect(page.locator(".vow-bottom")).toHaveCSS("opacity", "1");
});
