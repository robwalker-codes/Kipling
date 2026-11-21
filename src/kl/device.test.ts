import { describe, it, expect } from "vitest";
import { Bench, frame, recover, type Noise } from "./bench";
import { Device, menu, rates, warn, epoch, type Path } from "./device";
import { Editor, layout } from "./editor";
import {
  block,
  cfb,
  checked,
  effective,
  training,
  provider,
  pack,
  unpack,
  maxCipher,
  validKey,
} from "./provider";
const fixed = (n: number) => new Uint8Array(n).fill(42);
const h = (s: string) => Uint8Array.from(Buffer.from(s, "hex"));
const hex = (data: Uint8Array) => Buffer.from(data).toString("hex");
function keys(d: Device, ...sequence: string[]) {
  sequence.forEach((k) => d.press(k));
}
function boot(d: Device) {
  keys(d, "SRCH", "Y");
  d.tick(400);
  keys(d, "0", "1", "ENTER");
  d.tick(500);
  expect(d.mode).toBe("menu");
}
function bench() {
  const b = new Bench(fixed);
  for (const d of b.devices) {
    keys(d, "SRCH", "Y");
  }
  b.step(400);
  for (const d of b.devices) keys(d, "0", "1", "ENTER");
  b.step(500);
  return b;
}
function compose(
  d: Device,
  buf = "A",
  body = "TEST MESSAGE",
  classification = "",
) {
  keys(d, "W", buf, "P", ...classification, "ENTER", ...body, "XIT");
  expect(d.buf.text).toBe((classification ? classification + "\n" : "") + body);
}
function encrypt(b: Bench, d = b.devices[0], buf = "A") {
  keys(d, "E", buf, "Y", "Y");
  b.step(600);
  expect(d.buf.kind).toBe("encrypted");
}
function comm(d: Device, path: Path, dir: "R" | "T", buffer = "A") {
  keys(d, "C");
  if (d.mode === "reuse") d.press("N");
  if (path === "digital") d.press("D");
  else keys(d, "A", path === "connector" ? "C" : "A");
  d.press(dir);
  if (dir === "T") {
    if (path === "acoustic") d.press("U");
    d.press(buffer);
  }
  if (d.mode === "rate") d.press("ENTER");
  if (d.mode === "notice" || d.mode === "ready") d.press("ENTER");
}
function setupLink(path: Path = "connector") {
  const b = bench(),
    [tx, rx] = b.devices;
  compose(tx);
  encrypt(b);
  if (path === "digital") {
    b.port(tx, "digital");
    b.port(rx, "digital");
  }
  return { b, tx, rx, path };
}
const material = effective(training, 0);
describe("Training provider", () => {
  it("CRYPT-07 primitive and external FIPS 81 D2 vectors in both directions", () => {
    const key = h("133457799bbcdff1"),
      data = h("0123456789abcdef"),
      c = h("85e813540f0ab405");
    expect(block(key)(data)).toEqual(c);
    expect(block(key, true)(c)).toEqual(data);
    const iv = h("1234567890abcdef"),
      plain = new TextEncoder().encode("Now is the"),
      expected = h("f31fda07011462ee187f");
    expect(cfb(data, iv, plain)).toEqual(expected);
    expect(cfb(data, iv, expected, true)).toEqual(plain);
    expect(
      hex(cfb(data, iv, plain.slice(0, 6))) +
        hex(
          cfb(
            data,
            Uint8Array.from([...iv.slice(6), ...expected.slice(0, 6)]),
            plain.slice(6),
          ),
        ),
    ).toBe(hex(expected));
  });
  it("KEY-03 KEY-04 KEY-06 KEY-08 reproducible training check and independent effective keys", () => {
    expect(training).toHaveLength(32);
    expect(validKey(training)).toBe(true);
    expect(validKey("A".repeat(31) + "B")).toBe(false);
    const a = provider.encrypt("ABC", material, fixed(8));
    expect(
      provider.decrypt(a, effective(checked(training.slice(0, 31)), 0)),
    ).toBe("ABC");
    for (const k of [effective("A".repeat(32), 0), effective(training, 1)])
      expect(() => provider.decrypt(a, k)).toThrow();
  });
  it("CRYPT-06 CRYPT-08 CRYPT-09 CRYPT-10 CRYPT-11 BUF-04 manual group encoding preserves every envelope byte", () => {
    for (const len of [1, 2, 3, 7, 8, 39, 40, 2599, 2600]) {
      const s = "A".repeat(len),
        a = provider.encrypt(s, material, fixed(8));
      expect(a.length).toBe(Math.ceil(((len + 15) * 8) / 5));
      expect(
        provider.decrypt(a.match(/.{1,3}/g)!.join(" "), material.slice()),
      ).toBe(s);
      expect(provider.encrypt(s, material, new Uint8Array(8))).not.toBe(a);
    }
    for (const text of [
      "",
      "0",
      "A",
      "AB",
      "A".repeat(maxCipher + 2),
      "A".repeat(maxCipher * 2 + 1),
      pack(Uint8Array.of(2, ...fixed(20))),
    ])
      expect(() => provider.decrypt(text, material)).toThrow();
    for (const bad of ["", "A".repeat(2601), "Æ"])
      expect(() => provider.encrypt(bad, material, fixed(8))).toThrow();
    expect(() => provider.encrypt("A", material, fixed(7))).toThrow();
    const good = unpack(provider.encrypt("ABC", material, fixed(8)));
    good[good.length - 1] ^= 1;
    expect(() => provider.decrypt(pack(good), material)).toThrow();
  });
  it("AUTH-02 AUTH-03 AUTH-04 AUTH-05 AUTH-06 AUTH-07 AUTH-08 second-resolution window crosses midnight and counter rollover", () => {
    for (const t of [
      Date.UTC(2000, 1, 29, 23, 59, 59),
      Date.UTC(1999, 11, 31, 23, 59, 59),
      32767000,
    ]) {
      const c = provider.challenge(t, 31),
        r = provider.reply(c, t, material);
      expect(r).toHaveLength(4);
      for (const secs of [-1200, -1199, 0, 1199, 1200])
        expect(provider.reply(c, t + 1000 * secs, material)).toBe(r);
      for (const secs of [-1201, 1201, 32768, 86400])
        expect(provider.reply(c, t + 1000 * secs, material)).not.toBe(r);
      expect(provider.reply(c, t, effective(training, 1))).not.toBe(r);
    }
    expect(() => provider.reply("ZZZ0", epoch, material)).toThrow();
  });
});
describe("Device controls", () => {
  it("POWER-01 POWER-02 startup confirmation, deadline and negative answers", () => {
    for (const ms of [14999, 15000, 15001]) {
      const d = new Device(fixed);
      keys(d, "W", "SRCH", "W");
      expect(d.display()[0].trim()).toBe("Confirm--Turn power on? (Y/N)");
      d.tick(ms);
      d.press("Y");
      expect(d.mode).toBe(ms < 15000 ? "boot" : "off");
    }
    for (const k of ["N", "XIT"]) {
      const d = new Device(fixed);
      keys(d, "SRCH", k);
      expect(d.mode).toBe("off");
    }
  });
  it("POWER-03 POWER-04 KEY-01 KEY-02 KEY-03 KEY-04 KEY-05 first activation, contrast and invalid/corrected key", () => {
    const d = new Device(fixed);
    d.factoryReset();
    keys(d, "↑+SRCH", "Y");
    d.tick(400);
    expect(d.contrast).toBe(9);
    keys(d, ..."123", "ENTER");
    expect(d.mode).toBe("factoryNum");
    keys(d, ..."4567890", "ENTER", ..."ABCDEFGHIJKLMNO", "ENTER");
    expect(d.mode).toBe("date");
    d.press("XIT");
    for (const i of [0, 4, 8, 12]) {
      expect(d.page).toBe(i);
      d.press("↓");
    }
    keys(d, "↑", "↓");
    for (const digits of ["00", "17", "0"]) {
      keys(d, ...digits, "ENTER");
      expect(d.mode).toBe("select");
      d.press("D CH");
    }
    keys(d, "1", "6", "ENTER", "ENTER");
    expect(d.mode).toBe("name");
    keys(d, ..."NAME1234567", "ENTER");
    expect(d.keyName).toBe("NAME123456");
    for (const group of ("A".repeat(31) + "B").match(/.{8}/g)!)
      keys(d, ...group, "ENTER");
    expect(d.display()[0].trim()).toBe("Key is Invalid");
    d.tick(500);
    keys(d, "T", "ENTER");
    for (const group of training.match(/.{8}/g)!)
      keys(d, "A", "D CH", ...group, "ENTER");
    d.tick(500);
    expect(d.active).toBe(15);
    expect(d.keys[15]?.name).toBe("T");
    expect(d.mode).toBe("menu");
  });
  it("MENU-01 MENU-02 POWER-05 POWER-06 QUIET-01 all menu shortcuts, cycling and restart", () => {
    const d = new Device(fixed);
    boot(d);
    for (let i = 0; i < 13; i++) d.press("↓");
    expect(d.menuIndex).toBe(0);
    d.press("↑");
    expect(d.menuIndex).toBe(12);
    for (const row of menu) {
      d.press(row[0]);
      expect(d.mode).not.toBe("menu");
      d.press("XIT");
      expect(d.mode).toBe("menu");
    }
    compose(d);
    keys(d, "Q", "S", "O", "N");
    expect(d.mode).toBe("menu");
    keys(d, "O", "Y");
    expect(d.active).toBe(-1);
    expect(d.display().join("").trim()).toBe("");
    d.tick(1000);
    expect(d.rtc).toBeGreaterThan(epoch);
    boot(d);
    expect(d.quiet).toBe(true);
    expect(d.buffers[0].text).toBe("TEST MESSAGE");
    keys(d, "Q", "N");
    expect(d.quiet).toBe(false);
  });
  it("BUF-01 BUF-02 EDIT-07 EDIT-09 REVIEW-01 content retention, read-only review and replacement", () => {
    const b = bench(),
      [d] = b.devices;
    compose(d, "B", "SAFE");
    compose(d, "A", "FIRST", "TRAINING");
    keys(d, "W", "A", "N", "!", "EOT", "2", "XIT");
    expect(d.buf.text).toBe("TRAINING\nFIRST2");
    keys(d, "R", "A", "↓", "X", "XIT");
    expect(d.buf.text).toBe("TRAINING\nFIRST2");
    encrypt(b, d);
    const before = d.buf.text;
    keys(d, "W", "A", "N");
    expect(d.mode).toBe("alert");
    d.press("XIT");
    expect(d.buf.text).toBe(before);
    keys(d, "W", "A", "Y", "C", "2", "XIT", "W", "A", "N", "3", "XIT");
    expect(d.buf).toEqual({ text: "23", kind: "typed" });
    expect(d.buffers[1].text).toBe("SAFE");
  });
  it("BUF-03 CRYPT-01 CRYPT-02 CRYPT-03 CRYPT-04 CRYPT-05 KEY-07 KEY-08 explicit operations, cancellation, change/update", () => {
    const b = bench(),
      [d] = b.devices;
    for (const op of ["E", "D", "R", "P"]) {
      keys(d, op, "B");
      expect(d.display()[0].trim()).toBe("MESSAGE SPACE B IS EMPTY");
      d.press("XIT");
    }
    compose(d);
    keys(d, "D", "A");
    expect(d.display()[0].trim()).toBe(warn.plain[0]);
    keys(d, "XIT", "E", "A", "Y", "N");
    expect(d.buf.kind).toBe("plain");
    for (const steps of [
      ["U", "N"],
      ["U", "Y", "N"],
    ]) {
      keys(d, ...steps);
      expect(d.key?.level).toBe(0);
    }
    keys(d, "E", "A", "N", "C", "0", "1", "ENTER");
    b.step(500);
    expect(d.mode).toBe("begin");
    d.press("Y");
    b.step(500);
    const c = d.buf.text;
    keys(d, "E", "A");
    expect(d.display()[0].trim()).toBe(warn.cipher[0]);
    keys(d, "XIT", "D", "A", "N", "U", "Y", "Y");
    b.step(500);
    keys(d, "ENTER", "Y");
    b.step(500);
    expect(d.buf.text).toBe(c);
    expect(d.display()[0].trim()).toBe(warn.bad[0]);
    keys(d, "XIT");
    d.key!.level = 0;
    keys(d, "D", "A", "Y", "Y");
    b.step(500);
    expect(d.buf.text).toBe("TEST MESSAGE");
    d.key!.level = 99;
    keys(d, "U", "Y", "Y");
    expect(d.key!.level).toBe(99);
    expect(d.mode).toBe("alert");
  });
  it("EDIT-01 EDIT-02 EDIT-03 EDIT-04 EDIT-05 EDIT-06 EDIT-08 BUF-04 editor controls and limits", () => {
    const e = new Editor();
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 (),.-/?") e.key(c);
    e.key("☂");
    expect(e.text).not.toContain("☂");
    e.key("BOT");
    e.key(">");
    e.key("D CH");
    expect(e.text[0]).toBe("B");
    e.key("ENTER");
    expect(e.text[0]).toBe("\n");
    e.key("EOT");
    e.key("BOL");
    e.key("↑");
    e.key("↓");
    e.key("EOL");
    e.key("<");
    expect(e.cursor).toBeLessThanOrEqual(e.text.length);
    expect(layout("A".repeat(81), false).starts).toEqual([0, 40, 80]);
    const word = new Editor("A LONG WORD");
    word.key("BOT");
    word.key("D WD");
    expect(word.text).toBe(" LONG WORD");
    expect(word.search("WORD")).toBe(true);
    expect(word.cursor).toBe(word.text.length);
    expect(word.search("WORD")).toBe(false);
    expect(word.search("")).toBe(false);
    const max = new Editor("A".repeat(2599));
    max.key("ENTER");
    max.key("B");
    expect(max.text.length).toBe(2600);
    const typed = new Editor("", true);
    for (const c of "0123456789AZ?!") typed.key(c);
    expect(typed.text).toBe("234567AZ");
    expect(typed.screen()[0]).toContain("234 567 AZ");
    const big = new Editor("A".repeat(maxCipher), true);
    big.key("B");
    expect(big.text.length).toBe(maxCipher);
    const d = new Device(fixed);
    boot(d);
    keys(
      d,
      "W",
      "A",
      "P",
      ..."A".repeat(21),
      "ENTER",
      ..."HELLO",
      "BOT",
      "SRCH",
      ..."EL",
      "ENTER",
    );
    expect(d.editor.cursor).toBe(24);
    keys(d, "SRCH", ..."Z".repeat(21));
    expect(d.input.length).toBe(20);
    d.press("ENTER");
    expect(d.display()[0].trim()).toBe("String not found");
  });
  it("TIME-01 TIME-02 TIME-03 TIME-04 VIEW-01 independent RTC, date editing, contrast and clock overlay", () => {
    const b = bench(),
      [d, o] = b.devices;
    d.rtc = Date.UTC(2000, 0, 31, 1, 2, 30);
    keys(d, "S", ">", "↑");
    expect(new Date(d.clockSet).getUTCDate()).toBe(29);
    keys(d, ">", ">", "↑");
    expect(new Date(d.clockSet).getUTCDate()).toBe(28);
    keys(d, ">", "↓", ">", "↑", "XIT");
    expect(new Date(d.rtc).getUTCSeconds()).toBe(0);
    expect(o.rtc).not.toBe(d.rtc);
    d.drift = 1000;
    const t = d.rtc;
    b.step(1000);
    expect(d.rtc - t).toBe(1001);
    keys(d, "V", ...Array(20).fill("↑"));
    expect(d.contrast).toBe(9);
    keys(d, ...Array(20).fill("↓"));
    expect(d.contrast).toBe(0);
    keys(d, "XIT", "W", "A", "P", "ENTER", "H", "CLK");
    expect(d.clockView).toBe(true);
    d.press("CLK");
    expect(d.editor.text).toBe("H");
    keys(d, "XIT", "E", "A", "Y", "Y", "CLK");
    expect(d.clockView).toBe(false);
  });
  it("AUTH-01 AUTH-02 manual challenge and reply through two independent keyboards", () => {
    const b = bench(),
      [a, c] = b.devices;
    keys(a, "A", "N", "C", "0", "1", "ENTER");
    b.step(500);
    a.press("C");
    b.step(100);
    keys(c, "A", "Y", "R", "Z", "D CH", ...a.challenge, "ENTER");
    b.step(100);
    expect(c.answer).toBe(a.answer);
    expect(c.display()[0].trim()).toContain(a.challenge);
    keys(c, "XIT", "A", "Y", "XIT");
    expect(c.mode).toBe("menu");
  });
  it("ZERO-01 ZERO-02 ZERO-03 ZERO-04 BATT-01 BATT-02 FAULT-01 FAULT-02 lifecycle boundaries", () => {
    const b = bench(),
      [d] = b.devices;
    compose(d);
    keys(d, "ZRO", "A", "N", "ZRO", "0", "1", "ENTER", "N");
    expect(d.key).toBeTruthy();
    keys(d, "E", "A", "Y", "Y", "ZRO", "0", "1", "ENTER", "Y");
    b.step(1000);
    expect(d.key).toBeFalsy();
    expect(d.buf.kind).toBe("plain");
    keys(d, "ZRO", "A", "Y");
    b.step(1000);
    expect(d.buffers.every((x) => !x.text)).toBe(true);
    d.replaceBattery();
    keys(d, "SRCH", "Y", "ZRO");
    expect(d.mode).toBe("erase");
    keys(d, "N");
    expect(d.mode).toBe("select");
    d.low();
    expect(d.display()[0].trim()).toBe("LOW BATTERY WARNING");
    b.step(239999);
    expect(d.mode).not.toBe("off");
    b.step(1);
    expect(d.mode).toBe("off");
    d.press("SRCH");
    expect(d.mode).toBe("off");
    d.replaceBattery();
    d.fault = true;
    keys(d, "SRCH", "Y");
    b.step(500);
    expect(d.mode).toBe("fault");
    d.press("HOLD XIT");
    keys(d, "SRCH", "Y");
    b.step(500);
    expect(d.mode).toBe("fault");
    d.fault = false;
    d.replaceBattery();
    keys(d, "SRCH", "Y");
    b.step(500);
    expect(d.mode).toBe("select");
  });
});
describe("Radio and peripheral procedures", () => {
  for (const path of ["acoustic", "connector", "digital"] as const)
    it(
      "COM-01 COM-02 COM-05 COM-09 COM-10 COM-11 COM-17 Appendix E exchange " +
        path,
      () => {
        const { b, tx, rx } = setupLink(path);
        compose(rx, "B", "KEEP");
        comm(rx, path, "R");
        expect(rx.mode).toBe("waiting");
        comm(tx, path, "T");
        expect(rx.mode).toBe("receiving");
        b.step(20000);
        expect(tx.mode).toBe("sent");
        expect(rx.buf).toEqual({ kind: "received", text: tx.buf.text });
        expect(rx.paper).toBe("");
        expect(rx.buffers[1].text).toBe("KEEP");
        keys(rx, "XIT", "D", "A", "Y", "Y");
        rx.rtc += 86400000;
        b.step(500);
        expect(rx.buf.text).toBe("TEST MESSAGE");
        keys(rx, "C", "Y");
        expect(rx.mode).toBe("rxFull");
        keys(rx, "Y", "A");
        if (path === "digital") rx.press("ENTER");
        rx.press("ENTER");
        tx.press("ENTER");
        b.step(20000);
        expect(rx.buf.kind).toBe("received");
      },
    );
  it("COM-03 COM-06 COM-07 COM-16 digital rates, wrong speed and size-dependent airtime", () => {
    const { b, rx, tx } = setupLink("digital");
    keys(rx, "C", "D", "R");
    for (let i = 0; i < 10; i++) {
      rx.press("↑");
      expect(rx.display()[0]).toContain(String(rates[rx.rate]));
    }
    keys(rx, "↓", "ENTER", "ENTER");
    comm(tx, "digital", "T");
    const duration = b.flight!.end - b.time;
    expect(duration).toBe(
      400 + Math.ceil((b.flight!.wire.length * 11000) / 300),
    );
    b.step(duration);
    expect(tx.mode).toBe("sent");
    expect(rx.mode).toBe("waiting");
    expect(rx.buf.kind).toBe("empty");
  });
  it("COM-04 COM-18 COM-19 printable-only transfer works; locally typed cipher cannot transmit", () => {
    const { b, tx, rx } = setupLink();
    const cipher = tx.buf.text;
    keys(rx, "W", "A", "C", ...cipher, "XIT");
    comm(rx, "connector", "T");
    expect(rx.lines).toEqual(warn.typed);
    keys(rx, "XIT", "D", "A", "Y", "Y");
    b.step(500);
    expect(rx.buf.text).toBe("TEST MESSAGE");
    comm(rx, "connector", "T");
    expect(rx.lines).toEqual(warn.noPlain);
    keys(rx, "XIT");
    encrypt(b, rx);
    comm(rx, "connector", "T");
    expect(rx.mode).toBe("sending");
  });
  it("COM-08 confirmed replacement of chosen full buffer versus cancellation", () => {
    const { b, rx } = setupLink();
    compose(rx, "A", "ONE");
    compose(rx, "B", "TWO");
    comm(rx, "connector", "R");
    keys(rx, "N");
    expect(rx.buffers.map((x) => x.text)).toEqual(["ONE", "TWO"]);
    comm(rx, "connector", "R");
    keys(rx, "Y", "B", "XIT");
    expect(rx.buffers.map((x) => x.text)).toEqual(["ONE", ""]);
    b.step(1000);
  });
  for (const noise of [
    "Clear",
    "Correctable bit",
    "Burst error",
    "Drop frame",
    "Lose carrier",
  ] as Noise[])
    it("COM-12 COM-13 COM-14 COM-15 impair and recover " + noise, () => {
      const { b, rx, tx } = setupLink();
      b.noise = noise;
      comm(rx, "connector", "R");
      comm(tx, "connector", "T");
      b.step(120001);
      if (["Clear", "Correctable bit"].includes(noise))
        expect(rx.buf.text).toBe(tx.buf.text);
      else {
        expect(rx.buf.kind).toBe("empty");
        expect(rx.lines).toEqual(
          noise === "Drop frame"
            ? warn.fail
            : noise === "Lose carrier"
              ? warn.sync
              : warn.noise,
        );
      }
      const another = setupLink();
      another.b.noise = noise;
      comm(another.rx, "connector", "R");
      comm(another.tx, "connector", "T");
      another.b.step(120001);
      expect(another.b.trace).toEqual(b.trace);
    });
  it("COM-07 COM-12 COM-13 COM-17 channel contention, unplug/replug and explicit retransmit", () => {
    const { b, rx, tx } = setupLink();
    comm(rx, "connector", "R");
    comm(tx, "connector", "T");
    b.setLink(false);
    b.setLink(true);
    b.step(20000);
    expect(rx.lines).toEqual(warn.sync);
    keys(rx, "XIT", "C", "Y", "ENTER");
    tx.press("ENTER");
    b.step(20000);
    expect(rx.mode).toBe("received");
    rx.press("XIT");
    tx.press("ENTER");
    comm(rx, "connector", "T");
    expect(rx.lines).toEqual(warn.sync);
    b.step(20000);
    b.port(tx, "disconnected");
    tx.press("ENTER");
    expect(tx.lines).toEqual(warn.fail);
    expect(() => recover(Uint8Array.of(0))).toThrow();
    expect(frame("A").length).toBe(15);
  });
  it("QUIET-02 QUIET-03 PRINT-01 PRINT-02 PRINT-03 PRINT-04 zeroise cancels printing", () => {
    const { b, rx, tx } = setupLink();
    keys(rx, "Q", "S", "C", "A", "A");
    expect(rx.lines).toEqual(warn.silent);
    expect(rx.alarms).toBe(0);
    keys(rx, "XIT");
    comm(rx, "connector", "R");
    comm(tx, "connector", "T");
    b.step(20000);
    expect(rx.mode).toBe("received");
    keys(rx, "XIT", "P", "A", "P");
    expect(rx.lines).toEqual(warn.fail);
    keys(rx, "XIT");
    b.port(rx, "printer");
    rx.press("P");
    b.step(20000);
    expect(rx.paper.trim().replace(/ /g, "")).toBe(tx.buf.text);
    keys(rx, "XIT", "L", "F", "XIT", "D", "A", "Y", "Y");
    b.step(500);
    keys(rx, "P", "A", "P", "N");
    const old = rx.paper;
    keys(rx, "P", "A", "P", "J");
    expect(rx.paper).toBe(old);
    rx.press("Y");
    b.step(50);
    expect(rx.paper).toBe(old + "TE");
    keys(rx, "ZRO", "A", "Y");
    b.step(10000);
    expect(rx.paper).toBe(old + "TE");
  });
  it("STATE-01 STATE-02 STATE-03 seeded keyboard stress maintains bounds and independent state", () => {
    const b = bench(),
      [a, z] = b.devices;
    expect(a.keys).not.toBe(z.keys);
    expect(a.keys[0]).not.toBe(z.keys[0]);
    let seed = 431991;
    const controls = [
      ...menu.map((s) => s[0]),
      ..."0123456789YNA",
      "XIT",
      "ENTER",
      "↑",
      "↓",
      "ZRO",
      "CLK",
    ];
    for (let i = 0; i < 4000; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      a.press(controls[seed % controls.length]);
      b.step(20);
      expect(a.display().map((x) => x.length)).toEqual([40, 40]);
      expect(a.editor.cursor).toBeGreaterThanOrEqual(0);
      expect(a.editor.cursor).toBeLessThanOrEqual(a.editor.text.length);
      expect(a.mode === "menu" && !a.key).toBe(false);
    }
    expect(z.mode).toBe("menu");
    expect(z.keys[0]?.level).toBe(0);
    expect(z.paper).toBe("");
  });
});

import screens from "../../tests/fixtures/lcd.json";
it("UI-02 DOC-01 manually transcribed LCD states and inhibited keys", () => {
  const b = bench(),
    [d, other] = b.devices;
  const check = (idx: number, unit = d) => {
    expect(unit.mode).toBe(screens[idx].mode);
    expect(unit.display().map((s) => s.trimEnd().replace(/ +/g, " "))).toEqual(
      screens[idx].rows.map((s) => s.trimEnd().replace(/ +/g, " ")),
    );
  };
  d.powerDown();
  d.press("SRCH");
  check(0);
  d.press("Y");
  d.press("Q");
  b.step(500);
  keys(d, "0", "1", "ENTER");
  b.step(500);
  check(1);
  keys(d, "W", "A", "P");
  check(2);
  keys(d, "ENTER", "S", "SRCH");
  check(3);
  keys(d, "XIT", "XIT", "E", "A");
  expect(d.display()[1]).toContain("Is this correct");
  keys(d, "Y");
  expect(d.display()[0]).toContain("Begin Encryption");
  keys(d, "Y", "XIT");
  check(4);
  b.step(500);
  comm(other, "connector", "R");
  check(6, other);
  comm(d, "connector", "T");
  check(8, other);
  check(9);
  b.step(10000);
  keys(other, "XIT", "D", "A", "Y");
  expect(other.display()[0]).toContain("Begin Decryption");
  other.press("Y");
  check(5, other);
  b.step(500);
  keys(other, "A", "Y");
  check(10, other);
  keys(other, "XIT", "C", "N", "D", "R", "ENTER", "ENTER");
  check(7, other);
  other.malfunction();
  check(11, other);
});
it("MENU-02 Every documented selection prompt rejects unrelated function inputs; screen state remains bounded", () => {
  const b = bench(),
    [d] = b.devices;
  // Visit each choice screen through the operator path; a spurious function key must not commit that choice.
  function walk(...commands: string[]) {
    for (const k of commands) {
      d.press(k);
      const before = d.mode;
      const rows = d.display();
      expect(rows.map((r) => r.length)).toEqual([40, 40]);
      if (
        ![
          "notice",
          "alert",
          "working",
          "clock",
          "off",
          "power",
          "boot",
          "edit",
          "review",
        ].includes(before)
      ) {
        d.press("UNASSIGNED");
        expect(d.mode).toBe(before);
        expect(d.display()).toEqual(rows);
      }
    }
  }
  walk(
    "Q",
    "S",
    "Q",
    "N",
    "O",
    "N",
    "K",
    "0",
    "3",
    "ENTER",
    "A",
    "ENTER",
    "A",
    "XIT",
    "U",
    "Y",
    "N",
    "U",
    "Y",
    "Y",
  );
  b.step(500);
  walk(
    "XIT",
    "S",
    "<",
    ">",
    "↑",
    "XIT",
    "W",
    "A",
    "P",
    "SPC",
    "ENTER",
    "SPC",
    "SRCH",
    "SPC",
    "ENTER",
  );
  b.step(500);
  walk(
    "XIT",
    "W",
    "A",
    "N",
    "XIT",
    "E",
    "A",
    "N",
    "U",
    "Y",
    "N",
    "A",
    "Y",
    "R",
    "XIT",
    "A",
    "Y",
    "C",
  );
  b.step(500);
  walk("XIT", "C", "A", "A", "T", "E", "A");
  d.press("XIT");
  compose(d, "B", "MORE");
  walk("C", "D", "R", "Y", "A", "ENTER", "ENTER", "XIT", "C", "Y");
  walk("XIT", "ZRO", "0", "2", "ENTER", "Y");
  b.step(500);
  expect(d.key).toBeTruthy();
  walk("P", "B", "P", "N", "P", "B", "L");
  expect(d.lines).toEqual(warn.fail);
});
it("BATT-02 ZERO-04 COM-13 interruption never resurrects a message or print job", () => {
  for (const action of [
    "port-tx",
    "port-rx",
    "zero-tx",
    "zero-rx",
    "off-tx",
    "lose-link",
  ]) {
    const { b, tx, rx } = setupLink();
    comm(rx, "connector", "R");
    comm(tx, "connector", "T");
    b.step(20);
    if (action === "port-tx" || action === "port-rx") {
      const d = action === "port-tx" ? tx : rx;
      b.port(d, "printer");
      b.port(d, "connector");
    }
    if (action === "zero-tx" || action === "zero-rx") {
      const d = action === "zero-tx" ? tx : rx;
      keys(d, "ZRO", "A", "Y");
    }
    if (action === "off-tx") tx.replaceBattery();
    if (action === "lose-link") b.setLink(false);
    b.step(20000);
    expect(rx.buffers[0].text).toBe("");
  }
  const b = bench(),
    [d] = b.devices;
  compose(d, "A", "ONE TWO THREE");
  d.port = "printer";
  keys(d, "P", "A", "P", "Y");
  b.step(75);
  expect(d.paper).toBe("ONE");
  b.port(d, "disconnected");
  b.step(25);
  expect(d.lines).toEqual(warn.fail);
  b.step(500);
  expect(d.paper).toBe("ONE");
  b.port(d, "printer");
  keys(d, "XIT", "P", "Y");
  b.step(25);
  d.press("XIT");
  expect(d.mode).toBe("print");
  d.printAt = Infinity;
  expect(() => b.step(-1)).toThrow();
  expect(() => b.step(86400001)).toThrow();
  b.setLink(true);
});
it("TIME-02 VIEW-01 POWER-04 BATT-01 RESET RTC, time limits, silent warnings and factory cancellation", () => {
  const d = new Device(fixed);
  d.unset = true;
  keys(d, "SRCH", "Y");
  d.tick(500);
  expect(d.mode).toBe("date");
  d.clockSet = Date.UTC(1970, 0, 1);
  d.press("↓");
  expect(d.clockSet).toBe(Date.UTC(1970, 0, 1));
  keys(d, "XIT", "0", "1", "ENTER");
  d.tick(500);
  keys(d, "CLK");
  expect(d.display()[0]).toContain("1970");
  keys(d, "CLK", "Q", "S");
  const alarms = d.alarms;
  d.low();
  d.low();
  expect(d.alarms).toBe(alarms);
  d.malfunction();
  expect(d.alarms).toBe(alarms);
  d.press("XIT");
  expect(d.mode).toBe("fault");
  d.factoryReset();
  keys(d, "SRCH", "Y");
  d.tick(400);
  expect(d.display()[0]).toContain("10 digits");
  keys(d, "XIT");
  expect(d.mode).toBe("off");
  keys(d, "SRCH", "Y");
  d.tick(400);
  keys(d, ..."0123456789", "ENTER");
  expect(d.display()[0]).toContain("15 letters");
  keys(d, "XIT");
  expect(d.mode).toBe("off");
});
it("EDIT-01 EDIT-02 EDIT-03 EDIT-04 STATE-03 generated insert/delete sequences agree with an independent reference list (seed 430815)", () => {
  let seed = 430815;
  const rand = (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  };
  for (const cipher of [false, true]) {
    const e = new Editor("", cipher),
      chars: string[] = [];
    let cursor = 0;
    for (let n = 0; n < 2000; n++) {
      const commands = [
        "BOT",
        "EOT",
        "<",
        ">",
        "D CH",
        "SPC",
        "ENTER",
        "A",
        "7",
        "Z",
        "2",
        "?",
        "8",
      ];
      const k = commands[rand(commands.length)];
      e.key(k);
      if (k === "BOT") cursor = 0;
      else if (k === "EOT") cursor = chars.length;
      else if (k === "<") cursor = Math.max(0, cursor - 1);
      else if (k === ">") cursor = Math.min(chars.length, cursor + 1);
      else if (k === "D CH") {
        if (cursor) chars.splice(--cursor, 1);
      } else if (!cipher || /^[A-Z2-7]$/.test(k)) {
        chars.splice(cursor++, 0, k === "ENTER" ? "\n" : k === "SPC" ? " " : k);
      }
      expect(e.cursor).toBe(cursor);
      expect(e.text).toBe(chars.join(""));
      expect(e.screen().every((s) => s.length <= 40)).toBe(true);
    }
  }
});
it("DOC-01 Appendix B warning transcriptions reflect the photographed scan", () => {
  expect(warn.cipher).toEqual(["WARNING: CIPHER TEXT IN BUFFER!", ""]);
  expect(warn.plain).toEqual(["WARNING: PLAIN TEXT IN BUFFER!", ""]);
  expect(warn.bad).toEqual(["MESSAGE DOES NOT DECRYPT PROPERLY", ""]);
  expect(warn.typed).toEqual([
    "CIPHER TEXT HAS BEEN LOCALLY ENTERED.",
    "COMMUNICATIONS DENIED.",
  ]);
  expect(warn.sync).toEqual([
    "LOSS OF SYNCHRONIZATION.",
    "COMMUNICATIONS ABORTED.",
  ]);
  expect(warn.noise).toEqual([
    "THERE WERE UNCORRECTABLE",
    "ERRORS PRESS EXIT.",
  ]);
  expect(warn.noPlain).toEqual([
    "MESSAGE IN PLAIN TEXT FORM",
    "COMMUNICATIONS DENIED.",
  ]);
  expect(warn.fail).toEqual([
    "FAILURE TO ESTABLISH COMMUNICATIONS.",
    "COMMUNICATIONS ABORTED.",
  ]);
  expect(warn.silent[0]).toBe("QUIET OPERATION: AUDIO OUTPUT DENIED.");
  expect(warn.low[0]).toBe("LOW BATTERY WARNING");
  expect(warn.fault[0]).toBe("MALFUNCTION! DO NOT USE");
});

it("REVIEW-01 read-only review scrolls a single line per arrow and ignores editing/navigation shortcuts", () => {
  const d = new Device(fixed);
  boot(d);
  keys(
    d,
    "W",
    "A",
    "P",
    "ENTER",
    "1",
    "ENTER",
    "2",
    "ENTER",
    "3",
    "ENTER",
    "4",
    "XIT",
    "R",
    "A",
  );
  expect(d.display().map((x) => x.trim())).toEqual(["1", "2"]);
  keys(d, "↓", "EOT", "D WD", "X");
  expect(d.display().map((x) => x.trim())).toEqual(["2", "3"]);
  keys(d, "↓", "↓");
  expect(d.display().map((x) => x.trim())).toEqual(["3", "4"]);
  d.press("↑");
  expect(d.display().map((x) => x.trim())).toEqual(["2", "3"]);
  keys(d, "XIT");
  expect(d.buf.text).toBe("1\n2\n3\n4");
});

it("BUF-04 EDIT-01 paste, classification and paragraph capacity are atomic at the device boundary", () => {
  const d = new Device(fixed);
  boot(d);
  keys(d, "W", "A", "P", ..."TRAIN", "ENTER");
  d.tick(500);
  d.paste("hello\r\n☂");
  expect(d.editor.text).toBe("TRAIN\nHELLO\n");
  d.paste("A".repeat(2600));
  expect(d.mode).toBe("alert");
  expect(d.editor.text).toBe("TRAIN\nHELLO\n");
  d.press("XIT");
  d.paste("A".repeat(2600 - d.editor.text.length));
  expect(d.editor.text.length).toBe(2600);
  d.press("B");
  expect(d.display()[0].trim()).toBe("Message space is full.");
  keys(d, "XIT", "XIT");
  expect(d.buf.text.length).toBe(2600);
});
