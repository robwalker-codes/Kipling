import { test, expect, type Page, type Locator } from "@playwright/test";
const face = (p: Page, n: number) =>
  p.getByRole("article", { name: "Terminal " + n, exact: true });
const lcd = (s: Locator) => s.getByRole("status");
async function click(s: Locator, ...keys: string[]) {
  for (const k of keys)
    await s.getByRole("button", { name: k, exact: true }).click();
}
async function type(p: Page, s: Locator, text: string) {
  await s.getByRole("group", { name: /keyboard$/ }).focus();
  await p.keyboard.type(text);
}
async function start(p: Page, n: number) {
  const s = face(p, n);
  await click(s, "SRCH", "Y");
  await p.clock.runFor(500);
  await type(p, s, "01");
  await click(s, "ENTER");
  await p.clock.runFor(600);
  await expect(lcd(s)).toContainText("WORD PROCESSOR");
}
async function create(p: Page, s: Locator, letter: string, text: string) {
  await type(p, s, "w" + letter + "p");
  await click(s, "ENTER");
  await type(p, s, text);
  await click(s, "XIT");
  await p.clock.runFor(600);
}
async function transform(p: Page, s: Locator, command: string) {
  await type(p, s, command + "ayy");
  await p.clock.runFor(700);
}
async function ready(
  p: Page,
  s: Locator,
  tx: boolean,
  reuse = false,
  acoustic = false,
) {
  await type(
    p,
    s,
    "c" +
      (reuse ? "n" : "") +
      "a" +
      (acoustic ? "a" : "c") +
      (tx ? "t" + (acoustic ? "u" : "") + "a" : "r"),
  );
  await p.clock.runFor(600);
  await click(s, "ENTER");
}
async function travel(p: Page) {
  await p.clock.runFor(3500);
}
test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.goto("/exhibits/kl43/");
  await page.getByLabel("Clock speed").selectOption("10");
});
test("BUILD-02 UI-01 UI-02 UI-03 COM-11 PRINT-02 physical exchange and print under a static subdirectory", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await expect(a.locator(".cap")).toHaveCount(59);
  await start(page, 1);
  await start(page, 2);
  await create(page, b, "b", "SECOND BUFFER");
  await create(page, a, "a", "TEST MESSAGE FROM TERMINAL ONE");
  await transform(page, a, "e");
  await ready(page, b, false);
  await expect(lcd(b)).toContainText("Waiting for Carrier");
  await ready(page, a, true);
  await travel(page);
  await expect(lcd(b)).toContainText("Transmission Complete");
  await click(b, "XIT");
  await type(page, b, "ra");
  await expect(lcd(b)).not.toContainText("TEST MESSAGE");
  await click(b, "XIT");
  await transform(page, b, "d");
  await type(page, b, "ra");
  await expect(lcd(b)).toContainText("TEST MESSAGE FROM TERMINAL ONE");
  await click(b, "XIT");
  await type(page, b, "rb");
  await expect(lcd(b)).toContainText("SECOND BUFFER");
  await click(b, "XIT");
  await b.getByLabel("Terminal 2 port").selectOption("printer");
  await type(page, b, "pap");
  await expect(lcd(b)).toContainText("Verify Printer");
  await expect(b.locator(".paperBox pre")).toHaveText("Paper ready");
  await type(page, b, "y");
  await travel(page);
  await expect(b.locator(".paperBox pre")).toContainText(
    "TEST MESSAGE FROM TERMINAL ONE",
  );
});
test("POWER-03 KEY-04 ZERO-01 ZERO-02 FAULT-02 factory key entry and fault recovery", async ({
  page,
}) => {
  const a = face(page, 1);
  await page.getByRole("button", { name: /Bench controls/ }).click();
  page.on("dialog", (d) => d.accept());
  const setup = page.getByRole("group", { name: "Terminal 1", exact: true });
  await setup.getByRole("button", { name: "Factory reset" }).click();
  await click(a, "SRCH", "Y");
  await page.clock.runFor(600);
  await type(page, a, "0123456789");
  await click(a, "ENTER");
  await type(page, a, "abcdefghijklmno");
  await click(a, "ENTER", "XIT");
  await type(page, a, "01");
  await click(a, "ENTER");
  async function enterKey(key: string) {
    await type(page, a, "demo");
    await click(a, "ENTER");
    for (const group of key.match(/.{8}/g)!) {
      await type(page, a, group);
      await click(a, "ENTER");
    }
  }
  await enterKey("B".repeat(32));
  await page.clock.runFor(600);
  await expect(lcd(a)).toContainText("Enter the Key name");
  await enterKey("A".repeat(32));
  await page.clock.runFor(600);
  await expect(lcd(a)).toContainText("WORD PROCESSOR");
  await click(a, "ZRO");
  await type(page, a, "an");
  await expect(lcd(a)).toContainText("WORD PROCESSOR");
  await click(a, "ZRO");
  await type(page, a, "01");
  await click(a, "ENTER", "Y");
  await page.clock.runFor(600);
  await expect(lcd(a)).toContainText("AVAILABLE");
  await setup.getByLabel("Persistent malfunction").check();
  await expect(lcd(a)).toContainText("MALFUNCTION");
  await setup.getByLabel("Persistent malfunction").uncheck();
  await setup.getByRole("button", { name: "Replace cells" }).click();
  await expect(lcd(a)).toHaveText(/^\s*$/);
});
test("COM-12 COM-14 QUIET-02 recover from noise and retry over connector in silent mode", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await create(page, a, "a", "QUIET CHECK");
  await transform(page, a, "e");
  await type(page, a, "qscaa");
  await expect(lcd(a)).toContainText("AUDIO OUTPUT DENIED");
  await click(a, "XIT");
  await page.getByLabel("Conditions").selectOption("Burst error");
  await ready(page, b, false);
  await ready(page, a, true);
  await travel(page);
  await expect(lcd(b)).toContainText("UNCORRECTABLE");
  await click(b, "XIT");
  await page.getByLabel("Conditions").selectOption("Correctable bit");
  await ready(page, b, false, true);
  await click(a, "ENTER");
  await travel(page);
  await expect(lcd(b)).toContainText("Transmission Complete");
});
test("CRYPT-04 KEY-08 COM-18 COM-19 manually carry cipher groups, reconcile updates and decrypt", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await create(page, a, "a", "AB");
  await transform(page, a, "e");
  await type(page, a, "ra");
  const cipher = (await lcd(a).innerText()).replace(/[^A-Z2-7]/g, "");
  expect(cipher.length).toBeGreaterThan(16);
  await type(page, b, "wac" + cipher);
  await click(b, "XIT");
  await type(page, b, "cacta");
  await expect(lcd(b)).toContainText("LOCALLY ENTERED");
  await click(b, "XIT");
  await type(page, b, "uyy");
  await page.clock.runFor(500);
  await click(b, "ENTER");
  await transform(page, b, "d");
  await expect(lcd(b)).toContainText("DOES NOT DECRYPT");
  await click(b, "XIT");
  // Put the original training material in another slot and explicitly select it.
  await type(page, b, "k02");
  await click(b, "ENTER");
  await type(page, b, "fresh");
  await click(b, "ENTER");
  await page.getByRole("button", { name: "Training key card" }).click();
  const groups = await page.locator("dialog code").allTextContents();
  await page.getByLabel("Close card").click();
  for (const group of groups) {
    await type(page, b, group);
    await click(b, "ENTER");
  }
  await page.clock.runFor(600);
  await transform(page, b, "d");
  await type(page, b, "ra");
  await expect(lcd(b)).toContainText("AB");
  await click(b, "XIT");
  await transform(page, b, "e");
  await ready(page, b, true);
  await expect(lcd(b)).toContainText("Transmitting");
});
test("AUTH-01 AUTH-08 verbal challenge and reply using only visible characters", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await type(page, a, "ayc");
  await page.clock.runFor(300);
  const match = (await lcd(a).innerText()).match(
    /Challenge: (\w{4}) +Reply: (\w{4})/,
  )!;
  expect(match).toBeTruthy();
  await type(page, b, "ayr" + match[1]);
  await click(b, "ENTER");
  await page.clock.runFor(300);
  await expect(lcd(b)).toContainText("Reply: " + match[2]);
});
test("UI-04 DOC-01 screenshot desktop and phone, find and print both guides", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await start(page, 1);
  await start(page, 2);
  await page.evaluate(() => document.fonts.ready);
  if (process.env.CAPTURE)
    await page.screenshot({
      path: "docs/screenshots/desktop.png",
      fullPage: true,
    });
  await page.setViewportSize({ width: 390, height: 844 });
  const a = face(page, 1),
    b = face(page, 2);
  expect((await b.boundingBox())!.y).toBeGreaterThan(
    (await a.boundingBox())!.y,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (process.env.CAPTURE)
    await page.screenshot({
      path: "docs/screenshots/mobile.png",
      fullPage: true,
    });
  await page.getByRole("button", { name: "Emulator user guide" }).click();
  await page.getByRole("textbox", { name: "Search guide" }).fill("drift");
  await page.getByRole("button", { name: "Control time and power" }).click();
  await expect(page.locator(".chapter")).toContainText("parts per million");
  await page.getByRole("button", { name: "Device operator’s guide" }).click();
  await expect(page.locator(".chapter")).toContainText("Arm Terminal 2 first");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".printManual")).toBeVisible();
  await expect(page.locator(".printManual")).toContainText("zeroise");
  await expect(page.locator("header")).toBeHidden();
});
test("COM-08 COM-13 terminal with both buffers full can cancel or clear one and recover from carrier loss", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await create(page, b, "a", "KEEP A");
  await create(page, b, "b", "REPLACE B");
  await create(page, a, "a", "RECEIVED TEXT");
  await transform(page, a, "e");
  await type(page, b, "cacr");
  await expect(lcd(b)).toContainText("Do you wish to clear");
  await type(page, b, "nra");
  await expect(lcd(b)).toContainText("KEEP A");
  await click(b, "XIT");
  await type(page, b, "cacryb");
  await click(b, "ENTER");
  await page.getByLabel("Conditions").selectOption("Lose carrier");
  await ready(page, a, true);
  await travel(page);
  await expect(lcd(b)).toContainText("LOSS OF SYNCHRONIZATION");
  await click(b, "XIT");
  await type(page, b, "cy");
  await click(b, "ENTER");
  await page.getByLabel("Conditions").selectOption("Clear");
  await click(a, "ENTER");
  await travel(page);
  await expect(lcd(b)).toContainText("Transmission Complete");
  await click(b, "XIT");
  await type(page, b, "dbyy");
  await travel(page);
  await type(page, b, "rb");
  await expect(lcd(b)).toContainText("RECEIVED TEXT");
  await click(b, "XIT");
  await type(page, b, "ra");
  await expect(lcd(b)).toContainText("KEEP A");
});
test("AUTH-05 TIME-04 different-day message decryption and clock repair for the spoken reply", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await page.getByRole("button", { name: /Bench controls/ }).click();
  const rtc = page.getByLabel("Terminal 2 clock");
  await rtc.fill("1991-08-16T09:00:00");
  await rtc.blur();
  await create(page, a, "a", "OTHER DAY");
  await transform(page, a, "e");
  await ready(page, b, false);
  await ready(page, a, true);
  await travel(page);
  await click(a, "XIT");
  await click(b, "XIT");
  await transform(page, b, "d");
  await type(page, b, "ra");
  await expect(lcd(b)).toContainText("OTHER DAY");
  await click(b, "XIT");
  await type(page, a, "ayc");
  await travel(page);
  const match = (await lcd(a).innerText()).match(
    /Challenge: (\w{4}) +Reply: (\w{4})/,
  )!;
  await type(page, b, "ayr" + match[1]);
  await click(b, "ENTER");
  await travel(page);
  await expect(lcd(b)).not.toContainText("Reply: " + match[2]);
  await click(b, "XIT");
  await page.getByRole("button", { name: "Synchronise clocks" }).click();
  await type(page, b, "ayr" + match[1]);
  await click(b, "ENTER");
  await travel(page);
  await expect(lcd(b)).toContainText("Reply: " + match[2]);
});
test("BATT-01 ZERO-02 STATE-02 battery deadline, sound-independent power and fresh session after all-zeroise", async ({
  page,
}) => {
  const a = face(page, 1);
  await start(page, 1);
  await create(page, a, "a", "RETAIN");
  await click(a, "ZRO");
  await type(page, a, "anra");
  await expect(lcd(a)).toContainText("RETAIN");
  await click(a, "XIT", "ZRO");
  await type(page, a, "ay");
  await travel(page);
  await expect(lcd(a)).toContainText("AVAILABLE");
  await page.getByRole("button", { name: /Bench controls/ }).click();
  await page
    .getByRole("group", { name: "Terminal 1", exact: true })
    .getByRole("button", { name: "Low battery" })
    .click();
  await expect(lcd(a)).toContainText("LOW BATTERY");
  await page.getByLabel("Clock speed").selectOption("50");
  await page.clock.runFor(5000);
  await expect(lcd(a)).toHaveText(/^\s*$/);
  await page.evaluate(() =>
    localStorage.setItem("kipling-field-session-v1", "malformed prior version"),
  );
  await page.reload();
  await expect(page.getByText(/earlier KIPLING browser session/)).toBeVisible();
  await start(page, 1);
  await type(page, a, "ra");
  await expect(lcd(a)).toContainText("MESSAGE SPACE A IS EMPTY");
});
test("QUIET-01 QUIET-02 switch back to normal acoustic mode, including the European line profile", async ({
  page,
}) => {
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await create(page, a, "a", "ACOUSTIC");
  await transform(page, a, "e");
  await type(page, a, "qscaa");
  await expect(lcd(a)).toContainText("OUTPUT DENIED");
  await click(a, "XIT");
  await type(page, a, "qn");
  await ready(page, b, false, false, true);
  await type(page, a, "caatea");
  await page.clock.runFor(500);
  await click(a, "ENTER");
  await travel(page);
  await expect(lcd(b)).toContainText("Transmission Complete");
});

test("BUILD-02 packaged standalone HTML performs the exchange with all asset requests blocked", async ({
  page,
}) => {
  await page.route("**/*", (route) =>
    route.request().isNavigationRequest() ? route.continue() : route.abort(),
  );
  await page.goto("/portable.html");
  await page.getByLabel("Clock speed").selectOption("10");
  const a = face(page, 1),
    b = face(page, 2);
  await start(page, 1);
  await start(page, 2);
  await create(page, a, "a", "PORTABLE BUILD CHECK");
  await transform(page, a, "e");
  await type(page, a, "ra");
  await ready(page, b, false);
  await expect(lcd(b)).toContainText("Waiting for Carrier");
  if (process.env.CAPTURE) {
    await page.setViewportSize({ width: 1440, height: 930 });
    await page
      .locator(".rack")
      .screenshot({ path: "docs/screenshots/receive.png" });
  }
  await click(a, "XIT");
  await ready(page, a, true);
  await travel(page);
  await expect(lcd(b)).toContainText("Transmission Complete");
  await click(b, "XIT");
  await transform(page, b, "d");
  await type(page, b, "ra");
  await expect(lcd(b)).toContainText("PORTABLE BUILD CHECK");
});
