import { maxPlain, maxCipher } from "./provider";
export const physical = /^[A-Z0-9 (),.\-/?]$/;
export type Content = "empty" | "plain" | "typed" | "encrypted" | "received";
export type BufferRecord = { kind: Content; text: string };
export const blank = (): BufferRecord => ({ kind: "empty", text: "" });
// Indices are logical insertion points. Display-only grouping spaces never enter a buffer.
export function layout(text: string, cipher: boolean) {
  const rendered = cipher ? text.replace(/(.{3})(?=.)/g, "$1 ") : text;
  const starts = [0],
    ends: number[] = [];
  let start = 0;
  while (start < rendered.length) {
    const newline = rendered.indexOf("\n", start);
    if (newline >= start && newline <= start + 40) {
      ends.push(newline);
      start = newline + 1;
      starts.push(start);
      continue;
    }
    if (rendered.length - start <= 40) break;
    let cut = rendered.lastIndexOf(" ", start + 39);
    cut = cut >= start ? cut + 1 : start + 40;
    ends.push(cut);
    start = cut;
    starts.push(start);
  }
  ends.push(rendered.length);
  return { rendered, starts, ends };
}
export class Editor {
  cursor: number;
  constructor(
    public text = "",
    public cipher = false,
  ) {
    this.cursor = text.length;
  }
  get limit() {
    return this.cipher ? maxCipher : maxPlain;
  }
  accepts(char: string) {
    return this.cipher
      ? /^[A-Z2-7]$/.test(char)
      : physical.test(char) || char === "\n";
  }
  position() {
    const page = layout(this.text, this.cipher);
    const display = this.cipher
      ? this.cursor +
        Math.floor(Math.min(this.cursor, Math.max(0, this.text.length - 1)) / 3)
      : this.cursor;
    const line = page.starts.findLastIndex((n) => n <= display);
    return { ...page, display, line, col: display - page.starts[line] };
  }
  key(k: string) {
    const { line, col, starts, ends } = this.position();
    const logical = (x: number) => (this.cipher ? x - Math.floor(x / 4) : x);
    if (k === "BOT") this.cursor = 0;
    else if (k === "EOT") this.cursor = this.text.length;
    else if (k === "<") this.cursor = Math.max(0, this.cursor - 1);
    else if (k === ">")
      this.cursor = Math.min(this.text.length, this.cursor + 1);
    else if (k === "BOL") this.cursor = logical(starts[line]);
    else if (k === "EOL") this.cursor = logical(ends[line]);
    else if (k === "↑" || k === "↓") {
      const n = Math.max(
        0,
        Math.min(starts.length - 1, line + (k === "↑" ? -1 : 1)),
      );
      this.cursor = logical(Math.min(starts[n] + col, ends[n]));
    } else if (k === "D CH") {
      if (this.cursor) {
        this.text =
          this.text.slice(0, this.cursor - 1) + this.text.slice(this.cursor);
        this.cursor--;
      }
    } else if (k === "D WD") {
      this.text =
        this.text.slice(0, this.cursor) +
        this.text.slice(this.cursor).replace(/^\s*\S+/, "");
    } else {
      const value = k === "SPC" ? " " : k === "ENTER" ? "\n" : k;
      if (!this.accepts(value)) return;
      if (this.text.length >= this.limit) return "full";
      this.text =
        this.text.slice(0, this.cursor) + value + this.text.slice(this.cursor);
      this.cursor++;
    }
  }
  search(term: string) {
    if (!term) return false;
    const i = this.text.indexOf(term, this.cursor);
    if (i < 0) return false;
    this.cursor = i + term.length;
    return true;
  }
  screen(): [string, string] {
    const { line, starts, ends, rendered, col } = this.position();
    const top = Math.max(0, line - 1);
    return [top, top + 1].map((n) => {
      let row = rendered.slice(
        starts[n] ?? rendered.length,
        ends[n] ?? rendered.length,
      );
      if (n === line && col === row.length && col < 40) row += "▏";
      return row;
    }) as [string, string];
  }
}
