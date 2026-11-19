export const profile = {
  id: "kipling-reconstruction-v1",
  columns: 40,
  rows: 4,
  bodyLimit: 1000,
  txSlots: 10,
  rxSlots: 20,
  printJobs: 100,
  paperWidth: 40,
  roll: 120,
  sheetLines: 20000,
  archiveSlips: 500,
  lineMs: 180,
  preamble: 1200,
  charMs: 30,
  turnaround: 300,
  ackMs: 400,
  timeout: 3000,
  losses: [0, 0.1, 0.3],
  start: Date.UTC(1998, 5, 15, 9),
  bootMs: 600,
} as const;
export function encode(raw: string) {
  const text = raw.replace(/\r\n?/g, "\n");
  if (/[^a-zA-Z0-9 .,!?'"():/+%=&#@*;\n-]/.test(text))
    throw Error("UNSUPPORTED CHARACTER");
  if (text.length > profile.bodyLimit) throw Error("MESSAGE TOO LONG");
  return text.toUpperCase();
}
export function wrap(text: string, width: number = profile.paperWidth) {
  if (!Number.isSafeInteger(width) || width < 1)
    throw Error("INVALID PAPER WIDTH");
  return text.split("\n").flatMap((line) => {
    const lines: string[] = [];
    for (let i = 0; i < line.length; i += width)
      lines.push(line.slice(i, i + width));
    return lines.length ? lines : [""];
  });
}
export const utc = (time: number) => new Date(time).toISOString();
export function parseUTC(value: string) {
  const input = value.length === 16 ? value + ":00" : value;
  const ms = Date.parse(input + "Z");
  if (
    !Number.isFinite(ms) ||
    utc(ms).slice(0, 19) !== input ||
    !/^\d{4}-/.test(input) ||
    ms < 0
  )
    throw Error("INVALID UTC DATE");
  return ms;
}
export const sample =
  "REQUEST DELIVERY OF TWO WATER CONTAINERS AND ONE RADIO BATTERY. ACKNOWLEDGE.";
