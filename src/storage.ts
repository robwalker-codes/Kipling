import { z } from "zod";
import { Simulation, scenarios } from "./engine";
import { profile as p, encode, parseUTC } from "./profile";
const time = z.number().int().min(0).max(253402300799999);
const call = z.string().regex(/^[A-Z0-9-]{1,12}$/),
  address = z.union([call, z.literal("*")]);
const body = z
  .string()
  .max(p.bodyLimit)
  .refine((v) => {
    try {
      return encode(v) === v;
    } catch {
      return false;
    }
  });
const id = z.string().regex(/^[MFA]-\d{4,15}$/);
const message = z.object({ id, from: call, to: address, body, created: time });
const received = message.extend({ received: time, unread: z.boolean() });
const lines = z.array(z.string().max(100)).max(p.sheetLines);
const printer = z.object({
  on: z.boolean(),
  connected: z.boolean(),
  jam: z.boolean(),
  auto: z.boolean(),
  paper: z.number().int().min(0).max(p.roll),
  sheet: lines,
  archive: z.array(lines).max(p.archiveSlips),
  jobs: z
    .array(
      z
        .object({
          record: received,
          lines: lines.min(1),
          done: z.number().int().min(0),
          reprint: z.boolean(),
        })
        .refine((j) => j.done < j.lines.length),
    )
    .max(p.printJobs),
});
const record = z.object({
  label: call,
  call,
  channel: z.enum(["01", "02", "03", "04"]),
  net: z.string().regex(/^[A-Z0-9-]{1,12}$/),
  epoch: z.string().refine((v) => {
    try {
      parseUTC(v + "T00:00");
      return true;
    } catch {
      return false;
    }
  }),
  offset: z.number().int(),
  power: z.boolean(),
  radio: z.boolean(),
  cable: z.boolean(),
  loss: z.union([z.literal(0), z.literal(0.1), z.literal(0.3)]),
  draft: body,
  address,
  saved: z.array(message).max(p.txSlots),
  inbox: z.array(received).max(p.rxSlots),
  printer,
  last: z
    .object({
      id,
      message,
      state: z.enum([
        "NO ACK",
        "SENT UNCONFIRMED",
        "ACKNOWLEDGED",
        "AWAITING ACK",
        "TRANSMITTING",
      ]),
    })
    .nullable(),
});
const schema = z.object({
  version: z.literal(1),
  time,
  scenario: z
    .number()
    .int()
    .min(0)
    .max(scenarios.length - 1),
  serial: z.number().int().nonnegative().max(1e14),
  stations: z.array(record).min(2).max(3),
});
export function serialize(sim: Simulation, include = false) {
  return JSON.stringify({
    version: 1,
    time: sim.time,
    serial: sim.serial,
    scenario: sim.scenario,
    stations: sim.stations.map((s) => {
      const {
        label,
        call,
        channel,
        net,
        epoch,
        offset,
        power,
        radio,
        cable,
        loss,
        address,
      } = s;
      const { on, connected, jam, auto, paper } = s.printer;
      return {
        label,
        call,
        channel,
        net,
        epoch,
        offset,
        power,
        radio,
        cable,
        loss,
        address,
        draft: include ? s.draft : "",
        saved: include ? s.saved : [],
        inbox: include ? s.inbox : [],
        last: include ? s.last : null,
        printer: {
          on,
          connected,
          jam,
          auto,
          paper,
          sheet: include ? s.printer.sheet : [],
          archive: include ? s.printer.archive : [],
          jobs: include ? s.printer.jobs : [],
        },
      };
    }),
  });
}
export function restore(text: string) {
  if (text.length > 2_000_000) throw Error("FILE TOO LARGE");
  const d = schema.parse(JSON.parse(text));
  if (
    new Set(d.stations.map((s) => s.call)).size !== d.stations.length ||
    d.stations.some((s) => !time.safeParse(s.offset + d.time).success)
  )
    throw Error("INVALID STATION CONFIGURATION");
  const sim = new Simulation(d.scenario);
  if (sim.stations.length !== d.stations.length)
    throw Error("INVALID STATION COUNT");
  sim.time = d.time;
  sim.serial = d.serial;
  d.stations.forEach((v, i) => {
    const s = sim.stations[i];
    const identities: { id: string }[] = [
      ...v.inbox,
      ...v.saved,
      ...v.printer.jobs.map((job) => job.record),
    ];
    if (v.last) identities.push(v.last, v.last.message);
    if (
      v.label !== s.label ||
      identities.some((record) => Number(record.id.slice(2)) > d.serial)
    )
      throw Error("INVALID RECORD IDENTITY");
    Object.assign(s, v, {
      printer: { ...v.printer, next: d.time + p.lineMs },
      key: null,
      notice: "KEY REQUIRED",
    });
    if (s.last && ["AWAITING ACK", "TRANSMITTING"].includes(s.last.state))
      s.last.state = "SENT UNCONFIRMED";
  });
  sim.dirty = d.stations.some(
    (s) =>
      s.draft ||
      s.saved.length ||
      s.inbox.length ||
      s.printer.sheet.length ||
      s.printer.archive.length,
  );
  return sim;
}
