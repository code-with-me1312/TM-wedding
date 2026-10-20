import { test, expect } from "@playwright/test";
test("keyboard opening, RSVP, change and return", async ({ page }) => {
  await page.goto("/preview");
  await page.getByRole("button", { name: "Open Mostafa" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "Mostafa & Tasneem",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await page.getByLabel("Joyfully accept").check();
  await page.getByLabel("Number attending").selectOption({ label: "2 guests" });
  await page.getByLabel("Leave a message").fill("So happy for you both!");
  await page.getByRole("button", { name: "Send with love" }).click();
  await expect(
    page.getByText("We can't wait to celebrate with you."),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Open Mostafa" }).click();
  await expect(page.getByLabel("Joyfully accept")).toBeChecked();
  await page.getByLabel("Regretfully decline").check();
  await page.getByRole("button", { name: "Update my response" }).click();
  await expect(page.getByText("You’ll be with us in spirit.")).toBeVisible();
});
test("invalid link and protected admin", async ({ page }) => {
  await page.goto("/invite/123");
  await expect(
    page.getByText("This invitation could not be found.", { exact: false }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
});
test("mobile invitation fits the screen and honors reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview");
  await page.getByRole("button", { name: "Open Mostafa" }).click();
  await expect(page.locator("#welcome-heading")).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-invitation.png",
    fullPage: true,
  });
});

test("desktop, tablet and narrow mobile layouts remain within viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/preview");
    await expect(
      page.getByRole("button", { name: "Open Mostafa" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440)
      await page.screenshot({ path: "test-results/desktop-envelope.png" });
    await page.getByRole("button", { name: "Open Mostafa" }).click();
    await expect(page.locator("#welcome-heading")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440)
      await page.screenshot({
        path: "test-results/desktop-invitation.png",
        fullPage: true,
      });
  }
});

test("compact laptop opening stays clear and calendar downloads", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 768 });
  await page.goto("/preview");
  const heading = await page.locator(".scene-heading").boundingBox();
  const envelope = await page.locator(".envelope").boundingBox();
  const prompt = await page.locator(".opening-copy").boundingBox();
  expect(envelope!.y).toBeGreaterThan(heading!.y + heading!.height);
  expect(envelope!.y + envelope!.height).toBeLessThan(prompt!.y);
  await page.getByRole("button", { name: "Open Mostafa" }).click();
  const defaultBlue = await page
    .locator("a")
    .evaluateAll((links) =>
      links.some((link) => getComputedStyle(link).color === "rgb(0, 0, 238)"),
    );
  expect(defaultBlue).toBe(false);
  await page.locator("#details").scrollIntoViewIfNeeded();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  expect((await download).suggestedFilename()).toBe(
    "mostafa-and-tasneem-wedding.ics",
  );
});
