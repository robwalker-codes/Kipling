import { blank, Editor, layout, physical, type BufferRecord } from "./editor";
import { effective, groups, training, validKey, provider } from "./provider";

type Pair = [string, string];
export const menu = [
  "W - WORD PROCESSOR",
  "Q - QUIET OPERATION",
  "S - SET TIME AND DATE",
  "K - KEY CHANGE",
  "U - UPDATE KEY",
  "E - ENCRYPT MESSAGE",
  "D - DECRYPT MESSAGE",
  "A - AUTHENTICATION",
  "P - PRINT",
  "C - COMMUNICATIONS",
  "R - REVIEW MESSAGE",
  "V - VIEW ANGLE ADJUST",
  "O - TURN UNIT OFF",
];
export const rates = [50, 75, 150, 300, 600, 1200, 2400, 4800, 9600, 19200];
export const epoch = Date.UTC(1991, 7, 15, 9);
export const warn = {
  cipher: ["WARNING: CIPHER TEXT IN BUFFER!", ""],
  plain: ["WARNING: PLAIN TEXT IN BUFFER!", ""],
  bad: ["MESSAGE DOES NOT DECRYPT PROPERLY", ""],
  fail: ["FAILURE TO ESTABLISH COMMUNICATIONS.", "COMMUNICATIONS ABORTED."],
  typed: ["CIPHER TEXT HAS BEEN LOCALLY ENTERED.", "COMMUNICATIONS DENIED."],
  sync: ["LOSS OF SYNCHRONIZATION.", "COMMUNICATIONS ABORTED."],
  noise: ["THERE WERE UNCORRECTABLE", "ERRORS PRESS EXIT."],
  noPlain: ["MESSAGE IN PLAIN TEXT FORM", "COMMUNICATIONS DENIED."],
  silent: ["QUIET OPERATION: AUDIO OUTPUT DENIED.", ""],
  low: ["LOW BATTERY WARNING", ""],
  fault: ["MALFUNCTION! DO NOT USE", ""],
} satisfies Record<string, Pair>;
const prompts = {
  off: ["", ""],
  power: ["Confirm--Turn power on? (Y/N)", ""],
  boot: ["KL-43C operator reconstruction", ""],
  factoryNum: ["Enter 10 digits", ""],
  factoryText: ["Enter 15 letters", ""],
  select: ["", ""],
  name: ["", "Enter the Key name"],
  sets: ["Enter Key Set", ""],
  menu: ["", ""],
  notice: ["", ""],
  alert: ["", ""],
  choose: [
    "A - Message A              Select",
    "B - Message B             Message to Use",
  ],
  clear: ["Do you wish to clear message", "from memory? (Y/N)"],
  format: ["P - Plain Text Mode C - Cipher Text Mode", "Select Editor Mode"],
  classification: ["Enter Classification:", ""],
  edit: ["", ""],
  search: ["Search String:", ""],
  review: ["", ""],
  verify: ["", "Is this correct (Y/N)?"],
  alternate: ["(U) Update or (C) Change the Key?", ""],
  begin: ["", ""],
  working: ["", ""],
  update: ["", "Is this the key to be updated (Y/N)?"],
  sure: ["Are you sure you want to update (Y/N)?", ""],
  updated: ["", "Press ENTER or XIT"],
  quiet: ["", ""],
  auth: ["(C) Challenge or (R) Reply ?", ""],
  reply: ["Enter the Challenge:", ""],
  result: ["", "Press XIT to return to the Main Menu"],
  zero: ["Which key is to be cleared?", 'Enter ID# or "A" for ALL'],
  erase: ["", ""],
  view: ["View Angle Adjust", "↑ or ↓    XIT when complete"],
  date: ["", ""],
  powerOff: ["Confirm --Turn the Unit OFF (Y/N)", ""],
  reuse: ["Use previous communications setup?", "(Y/N)"],
  medium: [
    "A - Audio Data                    Select",
    "D - Digital Data                Function",
  ],
  audio: [
    "A - Acoustic Coupler              Select",
    "C - Connector Audio             Function",
  ],
  direction: [
    "T - Transmit                      Select",
    "R - Receive                     Function",
  ],
  line: ["U - U.S. Lines", "E - European Lines"],
  rate: ["", "Press ENTER at Desired Speed"],
  rxFull: [
    "Memory space for message is not empty.",
    "Do you wish to clear? (Y/N)",
  ],
  rxClear: ["Select Message to Clear: A or B", ""],
  ready: ["Press ENTER when ready.", "Press XIT for Main Menu."],
  waiting: ["", ""],
  sending: ["Transmitting Message", ""],
  receiving: ["Receiving Message", ""],
  sent: [
    "Transmission Complete. Press ENTER to",
    "Retransmit or XIT for Main Menu",
  ],
  received: ["Transmission Complete", "Press XIT to return to Main Menu"],
  print: ["P-Print L-Line Feed F-Form Feed", "Select Function"],
  printWarn: [
    "WARNING!!! PLAIN TEXT. Verify Printer",
    "ONLY connected. Press (Y) to continue.",
  ],
  printing: ["Printing Message", "Press XIT to Stop"],
  printed: ["Printing Complete", "Press XIT"],
  fault: warn.fault,
} satisfies Record<string, Pair>;
export type Mode = keyof typeof prompts;
export type Path = "connector" | "acoustic" | "digital";
export type Port = Exclude<Path, "acoustic"> | "printer" | "disconnected";
export type Slot = { name: string; material: string; level: number };
export type Random = (size: number) => Uint8Array;
export const two = (n: number) => String(n).padStart(2, "0");
const clamp = (x: number, min: number, max: number) =>
  Math.min(max, Math.max(min, x));
const cycle = (i: number, max: number) => ((i % max) + max) % max;
const activeModes: Mode[] = ["sending", "receiving", "working"];
export class Device {
  mode: Mode = "off";
  keys: (Slot | null)[] = Array(16).fill(null);
  active = -1;
  slot = 0;
  page = 0;
  menuIndex = 0;
  buffers: [BufferRecord, BufferRecord] = [blank(), blank()];
  index = 0;
  editor = new Editor();
  reviewLines: string[] = [];
  reviewTop = 0;
  input = "";
  keyName = "";
  keyText = "";
  op = "";
  resume: Mode = "menu";
  lines: Pair = ["", ""];
  after: Mode = "menu";
  due = Infinity;
  now = 0;
  rtc = epoch;
  drift = 0;
  clockView = false;
  clockSet = epoch;
  field = 0;
  quiet = false;
  contrast = 5;
  phase = 0;
  factory = false;
  unset = false;
  fault = false;
  lowDue = Infinity;
  battery = false;
  generation = 0;
  port: Port = "connector";
  path: Path = "connector";
  dir: "T" | "R" = "R";
  rate = 3;
  phone = "U";
  previous: { path: Path; dir: "T" | "R"; rate: number; phone: string } | null =
    null;
  paper = "";
  spool = "";
  printAt = Infinity;
  challenge = "";
  answer = "";
  alarms = 0;
  transmit: () => void = () => {};
  constructor(
    readonly random: Random,
    readonly cipher = provider,
  ) {
    this.keys[0] = { name: "TRAINING", material: training, level: 0 };
  }
  get buf() {
    return this.buffers[this.index];
  }
  get letter() {
    return this.index ? "B" : "A";
  }
  get key() {
    return this.keys[this.active];
  }
  desc(i: number) {
    const slot = this.keys[i];
    return (
      two(i + 1) +
      "-" +
      (slot?.name ?? "AVAILABLE") +
      "-" +
      two(slot?.level ?? 0)
    );
  }
  go(m: Mode) {
    this.mode = m;
    this.due = Infinity;
    this.input = "";
    this.clockView = false;
    if (m !== "review") this.reviewLines = [];
  }
  main() {
    this.resume = "menu";
    if (this.fault) this.malfunction();
    else if (this.factory) this.go("factoryNum");
    else if (this.unset && !this.key) this.startDate();
    else this.go(this.key ? "menu" : "select");
  }
  message(lines: Pair, next: Mode, delay = 420) {
    this.go("notice");
    this.lines = lines;
    this.after = next;
    this.due = this.now + delay;
  }
  warning(lines: Pair, back: Mode = "menu") {
    this.go("alert");
    this.lines = lines;
    this.after = back;
    if (!this.quiet) this.alarms++;
  }
  powerDown() {
    this.generation++;
    this.active = -1;
    this.keyText = "";
    this.spool = "";
    this.printAt = Infinity;
    this.editor = new Editor();
    this.resume = "menu";
    this.go("off");
  }
  malfunction() {
    this.powerDown();
    this.keys.fill(null);
    this.go("fault");
    if (!this.quiet) this.alarms++;
  }
  replaceBattery() {
    this.powerDown();
    this.battery = false;
    this.lowDue = Infinity;
  }
  low() {
    if (!this.battery) {
      this.battery = true;
      this.lowDue = this.now + 240000;
      if (!this.quiet) this.alarms++;
    }
  }
  factoryReset() {
    this.replaceBattery();
    this.keys.fill(null);
    this.buffers = [blank(), blank()];
    this.factory = true;
    this.unset = true;
    this.quiet = false;
    this.previous = null;
    this.contrast = 5;
    this.rtc = epoch;
    this.page = 0;
    this.fault = false;
  }
  tick(ms: number) {
    this.now += ms;
    this.rtc += ms * (1 + this.drift / 1e6);
    if (this.lowDue <= this.now) {
      this.powerDown();
      this.lowDue = Infinity;
      return;
    }
    if (this.mode === "printing") {
      if (this.port !== "printer") {
        this.spool = "";
        this.warning(warn.fail, "print");
      } else
        while (this.now >= this.printAt && this.spool) {
          this.paper += this.spool[0];
          this.spool = this.spool.slice(1);
          this.printAt += 25;
          if (!this.spool) this.go("printed");
        }
    }
    if (this.now < this.due) return;
    switch (this.mode) {
      case "power":
        this.powerDown();
        break;
      case "boot":
        if (this.fault) this.malfunction();
        else if (this.unset && !this.factory) this.startDate();
        else this.go(this.factory ? "factoryNum" : "select");
        break;
      case "notice":
        this.go(this.after);
        break;
      case "working":
        this.finishCrypto();
        break;
      case "waiting":
        this.warning(warn.fail);
        break;
    }
  }
  get deadline() {
    return Math.min(
      this.lowDue,
      this.due,
      this.mode === "printing" ? this.printAt : Infinity,
    );
  }
  display(): Pair {
    let rows: Pair = [...prompts[this.mode]];
    if (this.clockView || this.mode === "date") {
      const d = new Date(this.clockView ? this.rtc : this.clockSet),
        iso = d.toISOString();
      rows = [
        [
          d.toUTCString().slice(0, 3),
          d.toUTCString().slice(8, 11),
          two(d.getUTCDate()),
          d.getUTCFullYear(),
        ].join("   "),
        iso.slice(11, 19) +
          (this.clockView
            ? ""
            : "  " +
              ["DAY", "MONTH", "DATE", "YEAR", "HOUR", "MINUTE"][this.field]),
      ];
    } else
      switch (this.mode) {
        case "notice":
        case "alert":
          rows = this.lines;
          break;
        case "select":
          rows = [0, 1].map(
            (y) =>
              this.desc(this.page + y * 2).padEnd(18) +
              this.desc(this.page + y * 2 + 1).padEnd(17) +
              (y ? "#" + this.input : "↑↓"),
          ) as Pair;
          break;
        case "factoryNum":
        case "factoryText":
        case "classification":
        case "search":
        case "reply":
          rows[1] = this.input + "▏";
          break;
        case "name":
          rows = [
            "ID# " + two(this.slot + 1) + "   Enter the Key name",
            this.input + "▏",
          ];
          break;
        case "sets":
          rows = [
            "Enter Key Set " + (1 + this.keyText.length / 8),
            this.input + "▏",
          ];
          break;
        case "menu":
          rows = [
            menu[this.menuIndex].padEnd(24) + "↑ or ↓ or",
            menu[(this.menuIndex + 1) % 13].padEnd(24) + "Select Function",
          ];
          break;
        case "review":
          rows = [
            this.reviewLines[this.reviewTop] ?? "",
            this.reviewLines[this.reviewTop + 1] ?? "",
          ];
          break;
        case "edit":
          rows = this.editor.screen();
          break;
        case "verify":
        case "update":
        case "updated":
          rows[0] = this.desc(this.active);
          break;
        case "begin":
          rows[0] =
            "Begin " +
            (this.op === "E" ? "Encryption" : "Decryption") +
            "? (Y/N)";
          break;
        case "working":
          rows[0] =
            this.op === "E"
              ? "Encrypting"
              : this.op === "D"
                ? "Decrypting"
                : "Generating reply";
          break;
        case "quiet":
          rows = [
            "S - Silent Mode" + (this.quiet ? " [On]" : ""),
            "N - Normal Mode" + (!this.quiet ? " [On]" : ""),
          ];
          break;
        case "result":
          rows[0] = "Challenge: " + this.challenge + "  Reply: " + this.answer;
          break;
        case "zero":
          if (this.input) rows[1] = "ID# " + this.input;
          break;
        case "erase":
          rows =
            this.slot === -1
              ? ["Do you want all keys cleared? (Y/N)", ""]
              : [this.desc(this.slot), "Is this the key to be zeroed? (Y/N)"];
          break;
        case "rate":
          rows[0] = rates[this.rate] + " Baud   ↑ or ↓ to Select Speed";
          break;
        case "waiting":
          rows[0] =
            this.path === "digital"
              ? "Waiting for Data..."
              : "Waiting for Carrier...";
          break;
      }
    if (
      this.battery &&
      this.mode !== "off" &&
      this.mode !== "fault" &&
      this.lowDue - this.now > 238000
    )
      rows = warn.low;
    return rows.map((row) => row.slice(0, 40).padEnd(40)) as Pair;
  }
  fieldInput(k: string, re: RegExp, limit: number) {
    if (k === "D CH") this.input = this.input.slice(0, -1);
    else if (re.test(k) && this.input.length < limit) this.input += k;
  }
  selectKey() {
    this.active = this.slot;
    this.message([this.desc(this.slot), "Is the selected key"], this.resume);
  }
  editDate(k: string) {
    const d = new Date(this.clockSet),
      dir = k === "↑" ? 1 : -1;
    if (k === "<" || k === ">") {
      this.field = cycle(this.field + (k === ">" ? 1 : -1), 6);
      return;
    }
    if (k === "XIT") {
      this.rtc = Math.floor(this.clockSet / 60000) * 60000;
      this.unset = false;
      this.main();
      return;
    }
    if (!["↑", "↓"].includes(k)) return;
    if (this.field === 1 || this.field === 3) {
      const day = d.getUTCDate();
      d.setUTCDate(1);
      if (this.field === 1) d.setUTCMonth(d.getUTCMonth() + dir);
      else d.setUTCFullYear(d.getUTCFullYear() + dir);
      const end = new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
      ).getUTCDate();
      d.setUTCDate(Math.min(end, day));
    } else if (this.field === 4) d.setUTCHours(d.getUTCHours() + dir);
    else if (this.field === 5) d.setUTCMinutes(d.getUTCMinutes() + dir);
    else d.setUTCDate(d.getUTCDate() + dir);
    if (d.getUTCFullYear() >= 1970 && d.getUTCFullYear() <= 2099)
      this.clockSet = d.getTime();
  }
  startDate() {
    this.clockSet = this.rtc;
    this.field = 0;
    this.go("date");
  }
  receiveSpace() {
    const i = this.buffers.findIndex((b) => b.kind === "empty");
    if (i < 0) this.go("rxFull");
    else {
      this.index = i;
      this.preReady();
    }
  }
  preReady() {
    if (this.path === "digital") this.go("rate");
    else this.prepare();
  }
  prepare() {
    this.previous = {
      path: this.path,
      dir: this.dir,
      rate: this.rate,
      phone: this.phone,
    };
    if (this.dir === "T") this.message(["Please Wait", ""], "ready");
    else this.go("ready");
  }
  route() {
    if (this.path === "acoustic" && this.quiet) {
      this.warning(warn.silent);
      return;
    }
    if (this.dir === "R") this.receiveSpace();
    else if (this.path === "acoustic") this.go("line");
    else this.go("choose");
  }
  chooseBuffer(k: string) {
    this.index = k === "B" ? 1 : 0;
    if (this.op === "W") {
      if (this.buf.kind === "empty")
        this.message(
          ["Message Space is Empty:", "Starting New Message:"],
          "format",
        );
      else this.go("clear");
      return;
    }
    if (this.buf.kind === "empty") {
      this.warning(["MESSAGE SPACE " + this.letter + " IS EMPTY", ""]);
      return;
    }
    if (this.op === "R") {
      const lines = layout(this.buf.text, this.buf.kind !== "plain");
      this.reviewLines = lines.starts.map((start, i) =>
        lines.rendered.slice(start, lines.ends[i]),
      );
      this.reviewTop = 0;
      this.go("review");
    } else if (this.op === "P") this.go("print");
    else if (this.op === "C") {
      if (this.buf.kind === "plain") this.warning(warn.noPlain);
      else if (this.buf.kind === "typed") this.warning(warn.typed);
      else this.preReady();
    } else if (this.op === "E" && this.buf.kind !== "plain")
      this.warning(warn.cipher);
    else if (this.op === "D" && this.buf.kind === "plain")
      this.warning(warn.plain);
    else this.go("verify");
  }
  finishCrypto() {
    if (!this.key) {
      this.main();
      return;
    }
    const key = effective(this.key.material, this.key.level);
    if (this.op === "A") {
      this.answer = this.cipher.reply(this.challenge, this.rtc, key);
      this.go("result");
      return;
    }
    try {
      const encrypt = this.op === "E";
      const text = encrypt
        ? this.cipher.encrypt(this.buf.text, key, this.random(8))
        : this.cipher.decrypt(this.buf.text, key);
      this.buffers[this.index] = {
        text,
        kind: encrypt ? "encrypted" : "plain",
      };
      this.main();
    } catch {
      this.warning(warn.bad);
    }
  }
  startPrint() {
    if (this.port !== "printer") {
      this.warning(warn.fail, "print");
      return;
    }
    this.spool =
      (this.buf.kind === "plain" ? this.buf.text : groups(this.buf.text)) +
      "\n";
    this.printAt = this.now + 25;
    this.go("printing");
  }
  paste(raw: string) {
    if (this.mode !== "edit" || this.clockView) return;
    const full = () =>
      this.warning(
        ["Paste exceeds message capacity.", "Press XIT to resume editing."],
        "edit",
      );
    if (raw.length > this.editor.limit * 3) {
      full();
      return;
    }
    const chars = [...raw.replace(/\r\n?/g, "\n")]
      .map((c) => c.toUpperCase())
      .filter((c) => this.editor.accepts(c));
    if (this.editor.text.length + chars.length > this.editor.limit) {
      full();
      return;
    }
    for (const c of chars)
      this.press(c === "\n" ? "ENTER" : c === " " ? "SPC" : c);
  }
  press(raw: string) {
    const k = raw.toUpperCase();
    if (this.mode === "off") {
      if (k === "SRCH" || k === "↑+SRCH") {
        if (this.battery && this.lowDue === Infinity) return;
        if (k !== "SRCH") this.contrast = 9;
        this.go("power");
        this.due = this.now + 15000;
      }
      return;
    }
    if (this.mode === "fault") {
      if (k === "HOLD XIT") this.replaceBattery();
      return;
    }
    if (this.mode === "power") {
      if (k === "Y") {
        this.go("boot");
        this.due = this.now + 350;
      } else if (k === "N" || k === "XIT") this.powerDown();
      return;
    }
    if (this.mode === "boot" && k !== "ZRO") return;
    if (this.clockView) {
      this.clockView = false;
      return;
    }
    if (k === "CLK" && !activeModes.includes(this.mode)) {
      this.clockView = true;
      return;
    }
    if (k === "ZRO") {
      this.generation++;
      this.spool = "";
      this.resume = "menu";
      this.go(this.mode === "boot" ? "erase" : "zero");
      this.slot = -1;
      return;
    }
    if (this.mode === "notice") {
      this.go(this.after);
      if (k === "XIT") return;
    }
    if (this.mode === "alert") {
      this.go(this.after);
      return;
    }
    if (this.mode === "date") {
      this.editDate(k);
      return;
    }
    if (k === "XIT") {
      if (this.mode === "edit") {
        this.buffers[this.index] = this.editor.text
          ? {
              text: this.editor.text,
              kind: this.editor.cipher ? "typed" : "plain",
            }
          : blank();
        this.message(["Stored As Message " + this.letter, ""], "menu");
      } else if (this.mode === "updated") this.go(this.resume);
      else if (this.mode === "search") this.go("edit");
      else if (this.mode === "printing" || this.mode === "printed") {
        this.spool = "";
        this.go("print");
      } else if (this.mode === "working") return;
      else if (this.mode === "factoryNum" || this.mode === "factoryText")
        this.powerDown();
      else {
        this.generation++;
        this.main();
      }
      return;
    }
    switch (this.mode) {
      case "factoryNum":
      case "factoryText": {
        const digits = this.mode === "factoryNum";
        if (k === "ENTER" && this.input.length === (digits ? 10 : 15)) {
          if (digits) this.go("factoryText");
          else {
            this.factory = false;
            this.startDate();
          }
        } else
          this.fieldInput(k, digits ? /^\d$/ : /^[A-Z]$/, digits ? 10 : 15);
        break;
      }
      case "select":
      case "zero": {
        const zero = this.mode === "zero";
        if (!zero && (k === "↑" || k === "↓")) {
          if (k === "↑" && this.page === 0) this.contrast = 9;
          this.page = cycle(this.page + (k === "↑" ? -4 : 4), 16);
          break;
        }
        if (zero && k === "A") {
          this.slot = -1;
          this.go("erase");
          break;
        }
        if (k === "ENTER" && /^\d{2}$/.test(this.input)) {
          const i = Number(this.input) - 1;
          this.input = "";
          if (i < 0 || i >= 16) break;
          this.slot = i;
          if (zero) this.go("erase");
          else if (this.keys[i]) this.selectKey();
          else this.go("name");
        } else this.fieldInput(k, /^\d$/, 2);
        break;
      }
      case "name":
        if (k === "ENTER" && this.input) {
          this.keyName = this.input;
          this.keyText = "";
          this.message(["KEY NAME: " + this.keyName, ""], "sets");
        } else this.fieldInput(k, /^[A-Z0-9]$/, 10);
        break;
      case "sets":
        if (k === "ENTER" && this.input.length === 8) {
          this.keyText += this.input;
          this.input = "";
          if (this.keyText.length === 32) {
            if (validKey(this.keyText)) {
              this.keys[this.slot] = {
                name: this.keyName,
                material: this.keyText,
                level: 0,
              };
              this.selectKey();
            } else this.message(["Key is Invalid", ""], "name");
            this.keyText = "";
          }
        } else this.fieldInput(k, /^[A-Z]$/, 8);
        break;
      case "menu": {
        if (k === "↑" || k === "↓") {
          this.menuIndex = cycle(this.menuIndex + (k === "↓" ? 1 : -1), 13);
          break;
        }
        if (!menu.some((row) => row[0] === k)) break;
        this.op = k;
        this.resume = "menu";
        if (k === "S") this.startDate();
        else if (k === "C") this.go(this.previous ? "reuse" : "medium");
        else if ("WEDRP".includes(k)) this.go("choose");
        else
          this.go(
            (
              {
                Q: "quiet",
                K: "select",
                U: "update",
                A: "verify",
                V: "view",
                O: "powerOff",
              } as Record<string, Mode>
            )[k],
          );
        break;
      }
      case "choose":
        if (k === "A" || k === "B") this.chooseBuffer(k);
        break;
      case "clear":
        if (k === "Y") {
          this.buffers[this.index] = blank();
          this.go("format");
        } else if (k === "N") {
          if (["plain", "typed"].includes(this.buf.kind)) {
            this.editor = new Editor(this.buf.text, this.buf.kind === "typed");
            this.go("edit");
          } else
            this.warning([
              "Cipher text cannot be edited.",
              "Use Review Message.",
            ]);
        }
        break;
      case "format":
        if (k === "P") this.go("classification");
        if (k === "C") {
          this.editor = new Editor("", true);
          this.message(["The Editor is in the cipher text mode", ""], "edit");
        }
        break;
      case "classification":
        if (k === "ENTER") {
          this.editor = new Editor(this.input ? this.input + "\n" : "");
          this.message(["The Editor is in the plain text mode", ""], "edit");
        } else this.fieldInput(k === "SPC" ? " " : k, physical, 20);
        break;
      case "edit":
        if (k === "SRCH") this.go("search");
        else if (this.editor.key(k) === "full")
          this.warning(
            ["Message space is full.", "Press XIT to resume editing."],
            "edit",
          );
        break;
      case "search":
        if (k === "ENTER") {
          const found = this.editor.search(this.input);
          this.go("edit");
          if (!found) this.message(["String not found", ""], "edit");
        } else this.fieldInput(k === "SPC" ? " " : k, physical, 20);
        break;
      case "review":
        if (k === "↑" || k === "↓")
          this.reviewTop = clamp(
            this.reviewTop + (k === "↓" ? 1 : -1),
            0,
            Math.max(0, this.reviewLines.length - 2),
          );
        break;
      case "verify":
        if (k === "Y") this.go(this.op === "A" ? "auth" : "begin");
        else if (k === "N") this.go("alternate");
        break;
      case "alternate":
        if (k === "U" || k === "C") {
          this.resume = this.op === "A" ? "auth" : "begin";
          this.go(k === "U" ? "update" : "select");
        }
        break;
      case "update":
        if (k === "Y") this.go("sure");
        else if (k === "N") this.main();
        break;
      case "sure":
        if (k === "Y" && this.key) {
          if (this.key.level >= 99)
            this.warning(["Update limit reached", "Select a new training key"]);
          else {
            this.key.level++;
            this.message(["Key Update Complete", ""], "updated");
          }
        } else if (k === "N") this.main();
        break;
      case "updated":
        if (k === "ENTER") this.go(this.resume);
        break;
      case "begin":
        if (k === "N") this.main();
        else if (k === "Y") {
          this.go("working");
          this.due = this.now + 500;
        }
        break;
      case "auth":
        if (k === "C") {
          this.challenge = this.cipher.challenge(this.rtc, this.random(1)[0]);
          this.go("working");
          this.due = this.now + 100;
        } else if (k === "R") this.go("reply");
        break;
      case "reply":
        if (k === "ENTER" && this.input.length === 4) {
          this.challenge = this.input;
          this.go("working");
          this.due = this.now + 100;
        } else this.fieldInput(k, /^[A-Z2-7]$/, 4);
        break;
      case "erase":
        if (k === "Y") {
          if (this.slot === -1) {
            this.keys.fill(null);
            this.buffers = [blank(), blank()];
            this.active = -1;
            this.editor = new Editor();
          } else {
            this.keys[this.slot] = null;
            if (this.slot === this.active) this.active = -1;
          }
          this.keyText = "";
          this.message(["Zeroing ...", ""], this.key ? "menu" : "select");
        } else if (k === "N") this.main();
        break;
      case "quiet":
        if (k === "N" || k === "S") {
          this.quiet = k === "S";
          this.main();
        }
        break;
      case "view":
        if (k === "↑" || k === "↓")
          this.contrast = clamp(this.contrast + (k === "↑" ? 1 : -1), 0, 9);
        break;
      case "powerOff":
        if (k === "Y") this.powerDown();
        else if (k === "N") this.main();
        break;
      case "reuse":
        if (k === "N") this.go("medium");
        else if (k === "Y" && this.previous) {
          Object.assign(this, this.previous);
          this.route();
        }
        break;
      case "medium":
        if (k === "A") this.go("audio");
        else if (k === "D") {
          this.path = "digital";
          this.go("direction");
        }
        break;
      case "audio":
        if (k === "A" || k === "C") {
          this.path = k === "A" ? "acoustic" : "connector";
          if (this.path === "acoustic" && this.quiet) this.warning(warn.silent);
          else this.go("direction");
        }
        break;
      case "direction":
        if (k === "T" || k === "R") {
          this.dir = k;
          this.route();
        }
        break;
      case "line":
        if (k === "U" || k === "E") {
          this.phone = k;
          this.go("choose");
        }
        break;
      case "rxFull":
        if (k === "N") this.main();
        else if (k === "Y") this.go("rxClear");
        break;
      case "rxClear":
        if (k === "A" || k === "B") {
          this.index = k === "A" ? 0 : 1;
          this.buffers[this.index] = blank();
          this.preReady();
        }
        break;
      case "rate":
        if (k === "↑" || k === "↓")
          this.rate = cycle(this.rate + (k === "↑" ? 1 : -1), rates.length);
        else if (k === "ENTER") this.prepare();
        break;
      case "ready":
      case "sent":
        if (k === "ENTER") {
          if (this.dir === "T") this.transmit();
          else {
            this.go("waiting");
            this.due = this.now + 120000;
          }
        }
        break;
      case "print":
        if (k === "P") {
          if (this.buf.kind === "plain") this.go("printWarn");
          else this.startPrint();
        } else if (k === "F" || k === "L") {
          if (this.port === "printer") this.paper += k === "L" ? "\n" : "\f";
          else this.warning(warn.fail, "print");
        }
        break;
      case "printWarn":
        if (k === "Y") this.startPrint();
        else if (k === "N") this.main();
        break;
    }
  }
}
