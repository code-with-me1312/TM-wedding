import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
test("emulator: admin CRUD, private guest RSVP, statistics and revocation", async ({
  page,
  request,
  browser,
}) => {
  const email = `host-${randomUUID()}@example.test`;
  const password = randomUUID();
  const signup = await request.post(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
    { data: { email, password, returnSecureToken: true } },
  );
  expect(signup.ok()).toBe(true);
  const account = await signup.json();
  const allow = await request.patch(
    `http://127.0.0.1:8080/v1/projects/demo-tm-wedding/databases/(default)/documents/admins/${account.localId}`,
    {
      headers: { Authorization: "Bearer owner" },
      data: { fields: { enabled: { booleanValue: true } } },
    },
  );
  expect(allow.ok()).toBe(true);
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Our guestbook" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New invitation" }).click();
  await page.getByLabel("Guest / display name").fill("QA Ahmed & Sara");
  await page.getByLabel("People invited", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Save invitation" }).click();
  const row = page.getByRole("row").filter({ hasText: "QA Ahmed & Sara" });
  await expect(row).toBeVisible();
  await row.getByText("Private URL", { exact: true }).click();
  const url = await row.locator("a.private-url").getAttribute("href");
  expect(url).toMatch(/\/invite\/[a-f0-9]{64}$/);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const guest = await context.newPage();
  await guest.goto(url!);
  await guest.getByRole("button", { name: "Open Tasneem" }).click();
  await expect(
    guest.getByText("Dear QA Ahmed & Sara,", { exact: true }),
  ).toBeVisible();
  await guest.getByLabel("Joyfully accept").check();
  await guest
    .getByLabel("Number attending")
    .selectOption({ label: "2 guests" });
  await guest.getByLabel("Leave a message").fill("Emulator RSVP verified");
  await guest.getByRole("button", { name: "Send with love" }).click();
  await expect(
    guest.getByText("We can't wait to celebrate with you."),
  ).toBeVisible();
  await guest.reload();
  await guest.getByRole("button", { name: "Open Tasneem" }).click();
  await expect(guest.getByLabel("Joyfully accept")).toBeChecked();
  await expect(guest.locator("#attending-count option:checked")).toHaveText(
    "2 guests",
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(row.getByText("Attending", { exact: true })).toBeVisible();
  await expect(
    row.getByText("Emulator RSVP verified", { exact: true }),
  ).toBeVisible();
  const wa = await row
    .getByRole("link", { name: "WhatsApp" })
    .getAttribute("href");
  expect(decodeURIComponent(wa!)).toContain(url!);
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Guest / display name").fill("QA Hassan Family");
  await page.getByLabel("People invited", { exact: true }).fill("3");
  await page.getByRole("button", { name: "Save invitation" }).click();
  const edited = page.getByRole("row").filter({ hasText: "QA Hassan Family" });
  await expect(edited).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await edited.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Keep invitation" }).click();
  await expect(edited).toBeVisible();
  await edited.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete invitation", exact: true })
    .click();
  await expect(edited).toHaveCount(0);
  await guest.reload();
  await expect(
    guest.getByText("This invitation could not be found.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/admin\/login/);
  await context.close();
});
