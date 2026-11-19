import { test, expect } from "@playwright/test";
test("physical and onscreen input, exchange, print and persistence", async ({
  page,
}) => {
  await page.goto("/");
  const a = page.getByRole("article", { name: "Station ALPHA" }),
    b = page.getByRole("article", { name: "Station BRAVO" });
  await a.getByRole("button", { name: "COMPOSE", exact: true }).click();
  const input = a.getByRole("textbox");
  await input.fill("water");
  await input.press("End");
  await a.getByRole("button", { name: "S", exact: true }).click();
  await expect(input).toHaveValue("WATERS");
  await input.press("Enter");
  await input.press("2");
  await expect(input).toHaveValue("WATERS\n2");
  await a.getByRole("button", { name: "SEND", exact: true }).click();
  await b.getByRole("button", { name: "COMPOSE", exact: true }).click();
  await b.getByRole("textbox").fill("local draft");
  await expect(a.getByRole("status")).toHaveText("ACKNOWLEDGED");
  await expect(b.getByRole("textbox")).toBeFocused();
  await expect(b.getByRole("textbox")).toHaveValue("LOCAL DRAFT");
  await expect(b.getByLabel("Paper output")).toContainText("WATERS");
  await b.getByRole("button", { name: "READ", exact: true }).click();
  await expect(b.locator(".readout")).toContainText("WATERS");
  await b.getByRole("button", { name: "Tear off" }).click();
  await b.getByRole("button", { name: "Paper archive" }).click();
  await page.getByLabel("Paper selection").selectOption("0");
  await expect(page.locator(".slip")).toContainText("WATERS");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".slip")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await expect(a.getByRole("status")).toHaveText("KEY REQUIRED");
  await b.getByRole("button", { name: "READ", exact: true }).click();
  await expect(b.locator(".readout")).toContainText("WATERS");
});
test("narrow workspace, date repair at HQ and retry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Exercises", exact: true }).click();
  await page.getByLabel("Exercise", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "Load exercise" }).click();
  const a = page.getByRole("article", { name: "Station ALPHA" });
  await a.getByLabel("ALPHA recipient").selectOption("HQ");
  await a.getByRole("button", { name: "SEND", exact: true }).click();
  await expect(a.getByRole("status")).toHaveText("NO ACK", { timeout: 12000 });
  await page.getByRole("button", { name: "HQ", exact: true }).click();
  await page.getByRole("button", { name: "SETUP", exact: true }).click();
  await page.getByLabel("Station clock").fill("1998-06-15T09:01");
  await page.getByLabel("Apply station date").check();
  await page.getByRole("button", { name: "Save setup" }).click();
  await page.getByRole("button", { name: "ALPHA", exact: true }).click();
  await a.getByRole("button", { name: "Retry snapshot" }).click();
  await expect(a.getByRole("status")).toHaveText("ACKNOWLEDGED", {
    timeout: 10000,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("cold start and device recovery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Instructor", exact: true }).click();
  await page.getByRole("button", { name: "Start with equipment off" }).click();
  await page.getByRole("button", { name: "Operator", exact: true }).click();
  for (const name of ["ALPHA", "BRAVO"]) {
    const station = page.getByRole("article", { name: "Station " + name });
    await station
      .getByRole("button", { name: name + " terminal power" })
      .click();
    await station
      .getByRole("button", { name: name + " radio controls" })
      .click();
    await page.getByLabel("Radio power").check();
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
  const a = page.getByRole("article", { name: "Station ALPHA" }),
    b = page.getByRole("article", { name: "Station BRAVO" });
  await a.getByRole("button", { name: "COMPOSE", exact: true }).click();
  await expect(b.getByRole("status")).toHaveText("READY");
  await a.getByRole("textbox").fill("check power");
  await a.getByRole("button", { name: "SEND", exact: true }).click();
  await expect(a.getByRole("status")).toHaveText("ACKNOWLEDGED");
  await expect(b.getByLabel("Paper output")).not.toContainText("CHECK POWER");
  await b.getByRole("button", { name: "BRAVO printer controls" }).click();
  await page.getByLabel("Power on", { exact: true }).check();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(b.getByLabel("Paper output")).toContainText("CHECK POWER");
});
