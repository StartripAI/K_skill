import { expect, test } from "@playwright/test";

test("GUI runs the local Crush Coach flow and downloads real artifacts", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "K.skill Studio" })).toBeVisible();

  await page.getByLabel("Pack name").fill(`Playwright DM Pack ${Date.now()}`);
  await page.locator("input[type=file]").setInputFiles("examples/crush-chat-zh.txt");
  await page.getByRole("button", { name: /Upload to API/i }).click();
  await expect(page.getByText(/Imported \d+ sources?/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/sources/).first()).toBeVisible();

  await page.getByRole("button", { name: /Run lab/i }).click();
  await expect(page.getByText(/Report ready/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("soft_invite")).toBeVisible();
  await expect(page.getByText("Boundary-safe").first()).toBeVisible();

  const reportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Report markdown/i }).click();
  const report = await reportDownload;
  expect(report.suggestedFilename()).toContain("pursuit_report");

  const exportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export ZIP/i }).click();
  const zip = await exportDownload;
  expect(zip.suggestedFilename()).toContain("sillytavern");

  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.getByRole("heading", { name: /DM intake/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  expect(consoleErrors).toEqual([]);
});
