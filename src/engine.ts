import { encode, profile as p, utc, wrap, sample } from "./profile";
import { open, seal, type Header } from "./crypto";

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  created: number;
}
export interface Received extends Message {
  received: number;
  unread: boolean;
}
export interface Job {
  record: Received;
  lines: string[];
  done: number;
  reprint: boolean;
}
export interface Printer {
  on: boolean;
  connected: boolean;
  jam: boolean;
  auto: boolean;
  paper: number;
  jobs: Job[];
  sheet: string[];
  archive: string[][];
  next: number;
}
export interface Attempt {
  message: Message;
  id: string;
  state:
    | "TRANSMITTING"
    | "AWAITING ACK"
    | "ACKNOWLEDGED"
    | "NO ACK"
    | "SENT UNCONFIRMED";
}
export interface Station {
  label: string;
  call: string;
  channel: string;
  net: string;
  epoch: string;
  offset: number;
  key: Uint8Array<ArrayBuffer> | null;
  power: boolean;
  boot: boolean;
  bootGeneration: number;
  radio: boolean;
  cable: boolean;
  loss: number;
  revision: number;
  notice: string;
  draft: string;
  address: string;
  saved: Message[];
  inbox: Received[];
  last: Attempt | null;
  printer: Printer;
}
interface Event {
  time: number;
  order: number;
  run: () => void | Promise<void>;
}
interface Air {
  source: Station;
  channel: string;
  end: number;
  collided: boolean;
  valid: Map<Station, number>;
}
export const scenarios = [
  ["Free operation", "Operate the two stations independently."],
  [
    "First exchange",
    "Compose the water request at ALPHA, send to BRAVO, then read the inbox and inspect the paper.",
  ],
  [
    "Headquarters date",
    "This exercise models a reported date fault with a reconstructed key epoch. Send to BRAVO, then HQ. Set HQ to 15 June, apply its date and retry from ALPHA.",
  ],
  [
    "Different training keys",
    "Send to BRAVO. Load the shared exercise key at BRAVO and retry.",
  ],
  [
    "Radio disconnected",
    "Try SEND at ALPHA. Connect its radio, then send. Try radio power and channel changes.",
  ],
  [
    "Lost acknowledgement",
    "Send once. After NO ACK, retry the snapshot. Compare the receive store and print queue.",
  ],
  [
    "Busy net and collision",
    "Start carrier occupancy and send during the busy interval. Force a collision, then send individually.",
  ],
  [
    "Paper and memory",
    "Send with BRAVO out of paper. Replace the roll. Fill its inbox, send new text, delete a record and retry.",
  ],
  [
    "Midnight rollover",
    "Step across midnight. Apply the date at ALPHA only, send, then update BRAVO and retry.",
  ],
];
function station(label: string): Station {
  return {
    label,
    call: label,
    channel: "01",
    net: "FIELD",
    epoch: "1998-06-15",
    offset: 0,
    key: null,
    power: true,
    boot: false,
    bootGeneration: 0,
    radio: true,
    cable: true,
    loss: 0,
    revision: 0,
    notice: "READY",
    draft: "",
    address: label === "ALPHA" ? "BRAVO" : "ALPHA",
    saved: [],
    inbox: [],
    last: null,
    printer: {
      on: true,
      connected: true,
      jam: false,
      auto: true,
      paper: p.roll,
      jobs: [],
      sheet: [],
      archive: [],
      next: 0,
    },
  };
}
export function spool(s: Station, r: Received, reprint = false) {
  if (s.printer.jobs.length >= p.printJobs) return false;
  const lines = wrap(
    [
      "TRAINING RECONSTRUCTION",
      reprint ? "MANUAL REPRINT" : "MESSAGE RECEIPT",
      r.from + " > " + r.to,
      r.id,
      "TX " + utc(r.created),
      "RX " + utc(r.received),
      "",
      r.body,
      "— END —",
      "",
    ].join("\n"),
  );
  s.printer.jobs.push({ record: { ...r }, lines, done: 0, reprint });
  return true;
}
export function printerState(q: Printer) {
  if (!q.connected) return "DISCONNECTED";
  if (!q.on) return "PRINTER OFF";
  if (q.jam) return "JAMMED";
  if (!q.paper) return "OUT OF PAPER";
  if (q.sheet.length >= p.sheetLines) return "TEAR OFF PAPER";
  return q.jobs.length ? "PRINTING" : "ONLINE";
}
export class Simulation {
  time: number = p.start;
  stations: Station[] = [];
  scenario = 0;
  dirty = false;
  active = true;
  speed = 1;
  paused = false;
  events: Event[] = [];
  air: Air[] = [];
  trace: { time: number; text: string }[] = [];
  seed = 499;
  serial = 0;
  sequence = 0;
  ticking = false;
  dropData = false;
  dropAck = false;
  corrupt = false;
  readonly training = crypto.getRandomValues(new Uint8Array(32));
  constructor(index = 0) {
    this.scenario = index;
    this.stations = (
      index === 2 ? ["ALPHA", "BRAVO", "HQ"] : ["ALPHA", "BRAVO"]
    ).map(station);
    for (const s of this.stations) s.key = this.training.slice();
    const [a, b, h] = this.stations;
    if (index) a.draft = sample;
    if (h) {
      h.offset = -86400000;
      h.epoch = "1998-06-14";
    }
    if (index === 3) b.key = crypto.getRandomValues(new Uint8Array(32));
    if (index === 4) a.cable = false;
    if (index === 5) this.dropAck = true;
    if (index === 7) b.printer.paper = 0;
    if (index === 8) this.time = Date.UTC(1998, 5, 15, 23, 59, 59);
    this.log("Session ready");
  }
  log(text: string) {
    this.trace.unshift({ time: this.time, text });
    this.trace.length = Math.min(100, this.trace.length);
  }
  id(prefix: string) {
    return prefix + "-" + (++this.serial).toString().padStart(4, "0");
  }
  later(ms: number, run: Event["run"]) {
    this.events.push({ time: this.time + ms, order: ++this.sequence, run });
  }
  dispose() {
    this.active = false;
    this.events = [];
    this.air = [];
  }
  random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  async advance(ms: number) {
    if (this.ticking || !this.active || !Number.isFinite(ms) || ms < 0) return;
    this.ticking = true;
    try {
      const end = this.time + ms;
      while (this.active) {
        this.events.sort((a, b) => a.time - b.time || a.order - b.order);
        const next = this.events[0];
        if (!next || next.time > end) break;
        this.printUntil(next.time);
        this.time = next.time;
        this.events.shift();
        await next.run();
      }
      if (this.active) {
        this.printUntil(end);
        this.time = end;
      }
    } finally {
      this.ticking = false;
    }
  }
  printUntil(end: number) {
    for (const s of this.stations) {
      const q = s.printer;
      let t = q.next > this.time ? q.next : this.time + p.lineMs;
      if (printerState(q) !== "PRINTING") {
        q.next = end + p.lineMs;
        continue;
      }
      while (
        t <= end &&
        q.paper &&
        q.jobs.length &&
        q.sheet.length < p.sheetLines
      ) {
        const job = q.jobs[0];
        q.sheet.push(job.lines[job.done++]);
        q.paper--;
        if (job.done === job.lines.length) q.jobs.shift();
        t += p.lineMs;
      }
      q.next = t;
    }
  }
  invalidate(s: Station) {
    this.dirty = true;
    s.revision++;
    this.air = this.air.filter((f) => f.source !== s);
    if (s.last && ["TRANSMITTING", "AWAITING ACK"].includes(s.last.state)) {
      s.last.state = "SENT UNCONFIRMED";
      s.notice = s.last.state;
    }
  }
  togglePower(s: Station) {
    this.invalidate(s);
    s.power = !s.power;
    s.boot = s.power;
    s.notice = s.power ? "SELF TEST" : "POWER OFF";
    const generation = ++s.bootGeneration;
    if (s.power)
      this.later(p.bootMs, () => {
        if (s.power && s.bootGeneration === generation) {
          s.boot = false;
          s.notice = s.key ? "READY" : "KEY REQUIRED";
        }
      });
  }
  rename(s: Station, call: string) {
    if (
      !/^[A-Z0-9-]{1,12}$/.test(call) ||
      this.stations.some((o) => o !== s && o.call === call)
    )
      throw Error("INVALID OR DUPLICATE CALLSIGN");
    if (s.call !== call) {
      this.invalidate(s);
      s.call = call;
    }
  }
  snapshot(s: Station): Message {
    const body = encode(s.draft);
    if (!body.trim()) throw Error("EMPTY MESSAGE");
    return Object.freeze({
      id: this.id("M"),
      from: s.call,
      to: s.address,
      body,
      created: this.time + s.offset,
    });
  }
  store(s: Station) {
    if (s.saved.length >= p.txSlots) throw Error("STORE FULL");
    s.saved.push(this.snapshot(s));
    s.notice = "DRAFT STORED";
    this.dirty = true;
  }
  available(s: Station) {
    return s.power && !s.boot && s.cable && s.radio;
  }
  send(s: Station, retry = false, force = false) {
    if (!this.available(s))
      throw Error(!s.power ? "POWER OFF" : s.boot ? "SELF TEST" : "NO RADIO");
    if (!s.key) throw Error("NO KEY");
    if (!s.net || !s.channel || !s.call || !s.address)
      throw Error("SETUP REQUIRED");
    if (s.last && ["TRANSMITTING", "AWAITING ACK"].includes(s.last.state))
      throw Error("ATTEMPT IN PROGRESS");
    if (
      !force &&
      this.air.some((f) => f.channel === s.channel && f.end > this.time)
    )
      throw Error("NET BUSY");
    if (retry && (!s.last || s.last.state === "ACKNOWLEDGED"))
      throw Error("NO UNCONFIRMED MESSAGE");
    const m = retry ? s.last!.message : this.snapshot(s);
    if (m.from !== s.call) throw Error("CALLSIGN CHANGED");
    const a: Attempt = { id: this.id("A"), message: m, state: "TRANSMITTING" };
    s.last = a;
    s.notice = a.state;
    this.dirty = true;
    this.frame(
      s,
      [1, "DATA", s.call, m.to, m.id, a.id, s.net],
      JSON.stringify([m.body, m.created]),
      p.preamble + m.body.length * p.charMs,
    );
  }
  frame(s: Station, h: Header, payload: string, duration: number) {
    const revision = s.revision,
      channel = s.channel,
      ack = h[1] === "ACK";
    const encrypted = seal(s.key!, s.epoch, h, payload).catch(() => null);
    const f: Air = {
      source: s,
      channel,
      end: this.time + duration,
      collided: false,
      valid: new Map(),
    };
    for (const other of this.air) {
      if (other.channel === channel && other.end > this.time) {
        other.collided = true;
        f.collided = true;
      }
    }
    for (const r of this.stations) {
      if (r !== s && this.available(r) && r.channel === channel)
        f.valid.set(r, r.revision);
    }
    this.air.push(f);
    this.log(s.call + " " + h[1] + " ON AIR · " + h[5]);
    const sampledLoss = this.random() < s.loss;
    const drop = (ack ? this.dropAck : this.dropData) || sampledLoss,
      corrupt = this.corrupt;
    if (ack) this.dropAck = false;
    else this.dropData = false;
    this.corrupt = false;
    this.later(duration, async () => {
      this.air = this.air.filter((x) => x !== f);
      const env = await encrypted;
      if (!this.active || s.revision !== revision) return;
      if (!ack && s.last?.id === h[5]) {
        const attempt = s.last;
        attempt.state = h[3] === "*" ? "SENT UNCONFIRMED" : "AWAITING ACK";
        s.notice = attempt.state;
        this.later(p.timeout, () => {
          if (s.last === attempt && attempt.state === "AWAITING ACK") {
            attempt.state = "NO ACK";
            s.notice = "NO ACK";
            this.log(s.call + " ACK timeout");
          }
        });
      }
      if (!env || drop || f.collided) {
        this.log(
          !env
            ? "Encryption unavailable"
            : f.collided
              ? "Collision · " + h[5]
              : "Frame lost · " + h[5],
        );
        return;
      }
      if (corrupt) new Uint8Array(env.cipher)[0] ^= 1;
      for (const [r, rev] of f.valid) {
        if (
          !this.active ||
          s.revision !== revision ||
          r.revision !== rev ||
          !r.key
        )
          continue;
        let clear: string;
        try {
          clear = await open(r.key, r.epoch, r.net, env);
        } catch {
          if (this.active && r.revision === rev) {
            r.notice = "UNREADABLE FRAME";
            this.log(
              r.call +
                " authentication failed · check root key, net, epoch or frame integrity",
            );
          }
          continue;
        }
        if (!this.active || r.revision !== rev || s.revision !== revision)
          continue;
        if (h[3] !== r.call && h[3] !== "*") continue;
        if (ack) {
          const a = r.last;
          if (
            a?.state === "AWAITING ACK" &&
            a.id === h[5] &&
            a.message.id === h[4] &&
            a.message.to === h[2] &&
            clear === "ACCEPTED"
          ) {
            a.state = "ACKNOWLEDGED";
            r.notice = a.state;
            this.log(r.call + " ACK accepted");
          }
          continue;
        }
        if (!r.inbox.some((m) => m.id === h[4] && m.from === h[2])) {
          if (r.inbox.length >= p.rxSlots) {
            r.notice = "STORE FULL";
            this.log(r.call + " RX store full");
            continue;
          }
          const [body, created] = JSON.parse(clear);
          const m: Received = {
            id: h[4],
            body,
            created,
            received: this.time + r.offset,
            from: h[2],
            to: h[3],
            unread: true,
          };
          r.inbox.push(m);
          r.notice = "MESSAGE RECEIVED";
          if (r.printer.auto && !spool(r, m)) r.notice = "PRINT QUEUE FULL";
          this.log(r.call + " stored " + m.id);
        }
        if (h[3] !== "*")
          this.later(p.turnaround, () => {
            if (this.active && r.revision === rev && this.available(r) && r.key)
              this.frame(
                r,
                [1, "ACK", r.call, h[2], h[4], h[5], r.net],
                "ACCEPTED",
                p.ackMs,
              );
          });
      }
    });
  }
  fill(s: Station) {
    while (s.inbox.length < p.rxSlots)
      s.inbox.push({
        id: this.id("F"),
        body: "STORE EXERCISE",
        created: this.time,
        received: this.time,
        from: "EXERCISE",
        to: s.call,
        unread: false,
      });
    this.dirty = true;
  }
}
