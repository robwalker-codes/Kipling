import { describe, it, expect } from "vitest";
import { Simulation, printerState } from "./engine";
import { encode, profile as p, wrap, parseUTC, utc } from "./profile";
import { restore, serialize } from "./storage";
import { open, seal, type Header } from "./crypto";
import evidence from "./evidence.json";
function setup(index = 0) {
  const sim = new Simulation(index);
  const [a, b, h] = sim.stations;
  a.draft = "WATER\n\n" + "B".repeat(45);
  return { sim, a, b, h };
}
describe("independent station exchange", () => {
  it("T01/T09 transmits an immutable snapshot and prints the exact wrapped text", async () => {
    const { sim, a, b } = setup();
    const body = a.draft;
    b.draft = "LOCAL DRAFT";
    sim.send(a);
    a.draft = "DIFFERENT";
    await sim.advance(15000);
    expect(a.last?.state).toBe("ACKNOWLEDGED");
    expect(b.inbox).toHaveLength(1);
    expect(b.inbox[0]).toMatchObject({ body, unread: true });
    expect(b.draft).toBe("LOCAL DRAFT");
    expect(b.printer.sheet.join("\n")).toContain(wrap(body).join("\n"));
  });
  for (const field of [
    "channel",
    "cable",
    "radio",
    "key",
    "epoch",
    "net",
  ] as const)
    it("T02–04 repair " + field, async () => {
      const { sim, a, b } = setup();
      const original = { ...b };
      Object.assign(b, {
        [field]: {
          channel: "03",
          cable: false,
          radio: false,
          key: crypto.getRandomValues(new Uint8Array(32)),
          epoch: "1998-06-14",
          net: "OTHER",
        }[field],
      });
      sim.send(a);
      await sim.advance(10000);
      expect(a.notice).toBe("NO ACK");
      expect(b.inbox).toHaveLength(0);
      expect(JSON.stringify(sim.trace)).not.toContain("WATER");
      Object.assign(b, { [field]: original[field] });
      sim.send(a, true);
      await sim.advance(10000);
      expect(a.last?.state).toBe("ACKNOWLEDGED");
    });
  it("T05/T10 retries the original message after ACK loss and full RX", async () => {
    const { sim, a, b } = setup(5);
    sim.send(a);
    const first = a.last!;
    await sim.advance(15000);
    expect(first.state).toBe("NO ACK");
    sim.fill(b);
    const paper = [...b.printer.sheet];
    a.draft = "EDIT";
    sim.send(a, true);
    expect(a.last?.id).not.toBe(first.id);
    expect(a.last?.message.id).toBe(first.message.id);
    await sim.advance(10000);
    expect(a.last?.state).toBe("ACKNOWLEDGED");
    expect(b.printer.sheet).toEqual(paper);
    expect(b.inbox.filter((x) => x.unread)).toHaveLength(1);
    sim.send(a);
    await sim.advance(10000);
    expect(a.last?.state).toBe("NO ACK");
    b.inbox.pop();
    sim.send(a, true);
    await sim.advance(10000);
    expect(b.inbox.at(-1)?.body).toBe("EDIT");
    expect(a.last?.state).toBe("ACKNOWLEDGED");
  });
  it("T06 corrupt DATA and ACK independently", async () => {
    for (const ack of [false, true]) {
      const { sim, a, b } = setup();
      sim.corrupt = !ack;
      sim.send(a);
      if (ack) {
        await sim.advance(p.preamble + p.charMs * a.draft.length);
        sim.corrupt = true;
      }
      await sim.advance(12000);
      expect(a.last?.state).toBe("NO ACK");
      expect(b.inbox.length).toBe(ack ? 1 : 0);
    }
  });
  it("T07 busy and collided carriers then staggered recovery", async () => {
    const { sim, a, b } = setup();
    b.draft = "CHECK";
    sim.send(a);
    expect(() => sim.send(b)).toThrow("NET BUSY");
    sim.send(b, false, true);
    await sim.advance(12000);
    expect(a.inbox.length + b.inbox.length).toBe(0);
    expect(a.notice).toBe("NO ACK");
    sim.send(a, true);
    await sim.advance(10000);
    expect(b.inbox).toHaveLength(1);
  });
  it("T08 broadcast independently filters recipients and emits no ACK", async () => {
    const { sim, a, b, h } = setup(2);
    a.address = "*";
    sim.send(a);
    await sim.advance(10000);
    expect(h.inbox).toHaveLength(0);
    expect(b.inbox).toHaveLength(1);
    h.epoch = a.epoch;
    sim.send(a);
    await sim.advance(10000);
    expect(h.inbox).toHaveLength(1);
    expect(b.inbox).toHaveLength(2);
    expect(a.notice).toBe("SENT UNCONFIRMED");
    expect(sim.trace.some((x) => x.text.includes("ACK ON AIR"))).toBe(false);
  });
  it("T10 transmit store is bounded", () => {
    const { sim, a } = setup();
    for (let i = 0; i < p.txSlots; i++) sim.store(a);
    expect(() => sim.store(a)).toThrow("STORE FULL");
    expect(a.saved.length).toBe(p.txSlots);
  });
  for (const fault of ["paper", "on", "connected", "jam"] as const)
    it("T11 resumes interrupted printer " + fault, async () => {
      const { sim, a, b } = setup();
      sim.send(a);
      await sim.advance(p.preamble + p.charMs * a.draft.length + 440);
      const q = b.printer,
        partial = [...q.sheet];
      expect(partial.length).toBeGreaterThan(0);
      Object.assign(q, {
        [fault]: fault === "jam" ? true : fault === "paper" ? 0 : false,
      });
      await sim.advance(7000);
      expect(q.sheet).toEqual(partial);
      expect(a.notice).toBe("ACKNOWLEDGED");
      Object.assign(q, {
        [fault]: fault === "jam" ? false : fault === "paper" ? 100 : true,
      });
      const expected = q.jobs[0].lines;
      await sim.advance(10000);
      expect(q.sheet).toEqual(expected);
      expect(printerState(q)).toBe("ONLINE");
    });
  it("T12 validates and preserves text", () => {
    expect(encode("a\r\n\rB")).toBe("A\n\nB");
    expect(() => encode("ü")).toThrow();
    expect(encode("a".repeat(1000))).toHaveLength(1000);
    expect(() => encode("a".repeat(1001))).toThrow();
    expect(wrap("123456\n\nx", 3)).toEqual(["123", "456", "", "x"]);
  });
  for (const sender of [false, true])
    it("T13 sticky interval damage " + sender, async () => {
      const { sim, a, b } = setup();
      sim.send(a);
      await sim.advance(100);
      const s = sender ? a : b;
      sim.invalidate(s);
      s.cable = false;
      sim.invalidate(s);
      s.cable = true;
      await sim.advance(10000);
      expect(b.inbox).toHaveLength(0);
      expect(a.last?.state).not.toBe("ACKNOWLEDGED");
    });
  it("T14 disposal cancels crypto, TX, ACK wait and print jobs", async () => {
    for (const delay of [0, 100, 3000, 3900]) {
      const { sim, a, b } = setup();
      sim.send(a);
      await sim.advance(delay);
      const current = JSON.stringify([b.inbox, b.printer.sheet]);
      sim.dispose();
      await sim.advance(60000);
      expect(JSON.stringify([b.inbox, b.printer.sheet])).toBe(current);
      expect(new Simulation().stations[1].inbox).toHaveLength(0);
    }
  });
  it("T15 calendar boundaries never apply an epoch automatically", async () => {
    for (const day of ["2000-02-29", "1999-12-31", "1998-06-30"]) {
      const { sim, a } = setup();
      sim.time = parseUTC(day + "T23:59:59");
      a.epoch = day;
      await sim.advance(2000);
      expect(utc(sim.time).slice(0, 10)).not.toBe(day);
      expect(a.epoch).toBe(day);
    }
    expect(() => parseUTC("1999-02-29T00:00")).toThrow();
  });
  it("T16 persistence excludes keys, import restores interrupted work passively", async () => {
    const { sim, a } = setup();
    a.draft = "PAYLOAD";
    sim.send(a);
    expect(serialize(sim)).not.toContain("PAYLOAD");
    const data = serialize(sim, true);
    expect(data).not.toContain("training");
    const n = restore(data);
    expect(n.stations[0].key).toBeNull();
    expect(n.stations[0].last?.state).toBe("SENT UNCONFIRMED");
    await n.advance(12000);
    expect(n.stations[1].inbox).toHaveLength(0);
    expect(() => restore("{}")).toThrow();
    expect(() =>
      restore(data.replace('"channel":"01"', '"channel":"77"')),
    ).toThrow();
  });
  it("T18 includes identifiable evidence and assumptions", () => {
    expect(Object.keys(evidence.sources)).toHaveLength(9);
    expect(new Set(evidence.claims.map((c) => c.category)).size).toBe(5);
  });
});
it("authenticates ciphertext and canonical headers with a fresh nonce and local epoch", async () => {
  const { a } = setup();
  const root = a.key!,
    header: Header = [1, "DATA", "ALPHA", "BRAVO", "M-0001", "A-0002", "FIELD"];
  const f = await seal(root, a.epoch, header, "TEXT");
  expect(await open(root, a.epoch, a.net, f)).toBe("TEXT");
  expect((await seal(root, a.epoch, header, "TEXT")).nonce).not.toEqual(
    f.nonce,
  );
  await expect(open(root, "1998-06-14", a.net, f)).rejects.toThrow();
  await expect(open(new Uint8Array(32), a.epoch, a.net, f)).rejects.toThrow();
  await expect(
    open(root, a.epoch, a.net, {
      ...f,
      header: [1, "ACK", ...header.slice(2)] as unknown as Header,
    }),
  ).rejects.toThrow();
  new Uint8Array(f.cipher)[0] ^= 1;
  await expect(open(root, a.epoch, a.net, f)).rejects.toThrow();
});

it("retains only the latest boot deadline through rapid power cycling", async () => {
  const { sim, a } = setup();
  sim.togglePower(a);
  sim.togglePower(a);
  await sim.advance(300);
  sim.togglePower(a);
  sim.togglePower(a);
  await sim.advance(300);
  expect(a.boot).toBe(true);
  await sim.advance(300);
  expect(a.boot).toBe(false);
});
