import { Device, rates, warn, type Random, type Port } from "./device";
import { crc, maxCipher } from "./provider";
export const impairments = [
  "Clear",
  "Correctable bit",
  "Burst error",
  "Drop frame",
  "Lose carrier",
] as const;
export type Noise = (typeof impairments)[number];
export function frame(text: string) {
  const payload = new TextEncoder().encode(text),
    bytes = new Uint8Array(payload.length + 4);
  bytes.set(payload, 4);
  new DataView(bytes.buffer).setUint32(0, crc(payload));
  const wire = new Uint8Array(bytes.length * 3);
  bytes.forEach((v, i) => wire.fill(v, i * 3, i * 3 + 3));
  return wire;
}
export function recover(wire: Uint8Array) {
  if (wire.length % 3 || wire.length <= 12 || wire.length > (maxCipher + 4) * 3)
    throw Error("Frame size");
  const bytes = new Uint8Array(wire.length / 3);
  for (let i = 0; i < bytes.length; i++) {
    const [a, b, c] = wire.subarray(3 * i, 3 * i + 3);
    bytes[i] = (a & b) | (a & c) | (b & c);
  }
  const payload = bytes.subarray(4);
  if (crc(payload) !== new DataView(bytes.buffer).getUint32(0))
    throw Error("Frame checksum");
  return new TextDecoder().decode(payload);
}
type Flight = {
  tx: Device;
  rx: Device | null;
  txGen: number;
  rxGen: number;
  wire: Uint8Array;
  end: number;
  lost: boolean;
};
export class Bench {
  devices: [Device, Device];
  time = 0;
  seed = 43;
  noise: Noise = "Clear";
  connected = true;
  paused = false;
  speed = 1;
  flight: Flight | null = null;
  trace: string[] = [];
  constructor(random: Random) {
    this.devices = [new Device(random), new Device(random)];
    for (const d of this.devices) d.transmit = () => this.send(d);
  }
  log(text: string) {
    this.trace.unshift((this.time / 1000).toFixed(1) + " s  " + text);
    this.trace.length = Math.min(60, this.trace.length);
  }
  setLink(on: boolean) {
    if (this.connected !== on && this.flight) this.flight.lost = true;
    this.connected = on;
  }
  port(d: Device, p: Port) {
    if (
      d.port !== p &&
      d.path !== "acoustic" &&
      this.flight &&
      (this.flight.rx === d || this.flight.tx === d)
    )
      this.flight.lost = true;
    d.port = p;
  }
  supports(d: Device) {
    return d.path === "acoustic" ? !d.quiet : d.port === d.path;
  }
  send(tx: Device) {
    const rx = this.devices.find((d) => d !== tx)!;
    if (!this.connected || !this.supports(tx)) {
      tx.warning(warn.fail);
      this.log("Connection unavailable");
      return;
    }
    if (this.flight) {
      this.flight.lost = true;
      tx.warning(warn.sync);
      this.log("Overlapping transmissions");
      return;
    }
    const eligible =
      rx.mode === "waiting" &&
      rx.path === tx.path &&
      this.supports(rx) &&
      (tx.path !== "digital" || tx.rate === rx.rate);
    const wire = frame(tx.buf.text);
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    const at = Math.floor((this.seed / 4294967296) * (wire.length / 3)) * 3;
    const mask = 1 << (this.seed % 8);
    if (this.noise === "Correctable bit" || this.noise === "Burst error")
      wire[at] ^= mask;
    if (this.noise === "Burst error") wire[at + 1] ^= mask;
    const heard = eligible && this.noise !== "Drop frame";
    if (heard) rx.go("receiving");
    tx.go("sending");
    const rate = tx.path === "digital" ? rates[tx.rate] : 300,
      framing = tx.path === "digital" ? 11 : 8;
    this.flight = {
      tx,
      rx: heard ? rx : null,
      txGen: tx.generation,
      rxGen: rx.generation,
      wire,
      end: this.time + 400 + Math.ceil((1000 * wire.length * framing) / rate),
      lost: this.noise === "Lose carrier",
    };
    this.log(
      "Carrier started · " +
        tx.path +
        " · " +
        wire.length +
        " bytes · " +
        this.noise,
    );
  }
  finish(f: Flight) {
    this.flight = null;
    const source = f.tx.mode === "sending" && f.tx.generation === f.txGen;
    if (source) f.tx.go("sent");
    if (f.rx && f.rx.mode === "receiving" && f.rx.generation === f.rxGen) {
      if (!source || f.lost) {
        f.rx.warning(warn.sync);
        this.log("Carrier lost");
        return;
      }
      try {
        const text = recover(f.wire);
        f.rx.buffers[f.rx.index] = { kind: "received", text };
        f.rx.go("received");
        this.log("Ciphertext stored");
      } catch {
        f.rx.warning(warn.noise);
        this.log("Frame check failed");
      }
    } else this.log("Local transmission complete");
  }
  step(ms: number) {
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > 86400000)
      throw Error("Invalid clock step");
    const end = this.time + ms;
    while (this.time < end) {
      const next = Math.min(
        end,
        this.flight?.end ?? Infinity,
        ...this.devices.map((d) => d.deadline),
      );
      const dt = next - this.time;
      this.time = next;
      for (const d of this.devices) d.tick(dt);
      const f = this.flight;
      if (
        f &&
        (f.end <= next ||
          f.tx.generation !== f.txGen ||
          f.tx.mode !== "sending")
      )
        this.finish(f);
    }
  }
}
