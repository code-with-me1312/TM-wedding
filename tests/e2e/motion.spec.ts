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
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
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
    await expect(page.locator(".opening-chapter")).toHaveClass(/is-opening/);
    // Arrival/float animation must hand its pose to the opening zoom rather
    // than instantly switching to the full-size envelope.
    const opening = await page.locator(".envelope-camera").evaluate((camera) => {
      const style = getComputedStyle(camera);
      const chapter = document.querySelector(".opening-chapter")!;
      return {
        scale: new DOMMatrixReadOnly(style.transform).a,
        target: Number(getComputedStyle(chapter).getPropertyValue("--camera-zoom")),
        animation: style.animationName,
      };
    });
    expect(opening.animation).toContain("camera-open");
    expect(opening.scale).toBeLessThan(opening.target * 0.95);
    await expect(page.locator(".envelope-pocket-overlay")).toHaveCSS("opacity", "0");
    await expect(page.locator("#unfold-cue")).toBeFocused();
    await expect(page.locator(".opening-chapter")).toHaveClass(/is-open/);
    for (const photo of await page.locator(".keepsake-suite img").all()) {
      await expect
        .poll(() => photo.evaluate((e) => (e as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
    await expect(page.locator(".keepsake-card")).toHaveCSS("opacity", "1");
    const composition = await page.locator(".keepsake-suite").evaluate((suite) => {
      const card = suite.querySelector<HTMLElement>(".keepsake-card")!;
      const photo = suite.querySelector<HTMLElement>(".keepsake-photo-frame")!;
      const bouquet = suite.querySelector<HTMLElement>(".keepsake-bouquet")!;
      const center = (e: HTMLElement) => e.offsetLeft + e.offsetWidth / 2;
      const pocket = document.querySelector(".envelope-pocket-overlay")!.getBoundingClientRect();
      const bounds = suite.getBoundingClientRect();
      const matrix = getComputedStyle(card).transform.match(/matrix\(([^)]+)\)/)![1].split(",").map(Number);
      const ox = card.offsetWidth * 0.5, oy = card.offsetHeight * 0.85;
      // Conservative bounds around all date glyphs in the supplied SVG.
      const date = [[0.21, 0.65], [0.81, 0.65], [0.21, 0.76], [0.81, 0.76]].map(([u, v]) => {
        const dx = card.offsetWidth * u - ox, dy = card.offsetHeight * v - oy;
        const x = bounds.left + card.offsetLeft + ox + matrix[0] * dx + matrix[2] * dy;
        const y = bounds.top + card.offsetTop + oy + matrix[1] * dx + matrix[3] * dy;
        const edge = pocket.top + pocket.height * 0.7
          - pocket.height * 0.56 / (pocket.width * 0.47) * Math.abs(x - pocket.left - pocket.width / 2);
        return { x, y, clearance: edge - y };
      });
      return {
        photoHeight: photo.offsetHeight,
        cardHeight: card.offsetHeight,
        bouquetHeight: bouquet.offsetHeight,
        centerError: Math.abs(center(photo) - (center(card) + center(bouquet)) / 2),
        dateClearance: Math.min(...date.map(p => p.clearance)),
        dateVisible: date.every(p => p.x >= 0 && p.x < innerWidth && p.y >= 0 && p.y < innerHeight),
      };
    });
    expect(composition.photoHeight).toBeGreaterThan(composition.cardHeight * 1.5);
    if (viewport.width <= 640) {
      expect(composition.photoHeight).toBeGreaterThan(composition.cardHeight * 1.95);
    }
    const bouquetRatio = viewport.width <= 640 ? 1.1 : 1;
    expect(Math.abs(composition.cardHeight * bouquetRatio - composition.bouquetHeight)).toBeLessThanOrEqual(2);
    expect(composition.centerError).toBeLessThan(3);
    expect(composition.dateClearance).toBeGreaterThan(0);
    expect(composition.dateVisible).toBe(true);
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
  expect(height).toBeLessThan(await page.evaluate(() => innerHeight * 2.5));
  await expect(page.locator(".vow-bottom")).toHaveCSS("opacity", "1");
});
