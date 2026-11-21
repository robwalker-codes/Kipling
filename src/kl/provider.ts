import des from "des.js";
export const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const maxPlain = 2600,
  maxCipher = Math.ceil(((maxPlain + 15) * 8) / 5);
export const allowed = /^[A-Z0-9 (),.\-/?\n]*$/;
export function checked(prefix: string) {
  return (
    prefix +
    String.fromCharCode(
      65 + ([...prefix].reduce((s, c) => s + c.charCodeAt(0) - 65, 0) % 26),
    )
  );
}
export const training = checked("ABCDEFGHIJKLMNOPQRSTUVWXYZABCDE");
export const validKey = (text: string) =>
  /^[A-Z]{32}$/.test(text) && text === checked(text.slice(0, 31));
export function word64(n: bigint) {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n);
  return b;
}
export function effective(material: string, level: number) {
  let h = 14695981039346656037n;
  for (const c of "KL43/1/" + material + "/" + level)
    h = BigInt.asUintN(64, (h ^ BigInt(c.charCodeAt(0))) * 1099511628211n);
  return word64(h);
}
export function block(key: Uint8Array, decrypt = false) {
  const instance = des.DES.create({
    key,
    type: decrypt ? "decrypt" : "encrypt",
    padding: false,
  });
  return (src: Uint8Array) => {
    const out = new Uint8Array(8);
    instance._update(src, 0, out, 0);
    return out;
  };
}
export function cfb(
  key: Uint8Array,
  iv: Uint8Array,
  input: Uint8Array,
  reverse = false,
) {
  const transform = block(key),
    reg = iv.slice();
  return input.map((byte) => {
    const result = byte ^ transform(reg)[0];
    reg.copyWithin(0, 1);
    reg[7] = reverse ? byte : result;
    return result;
  });
}
export function pack(bytes: Uint8Array) {
  let bits = 0,
    n = 0,
    out = "";
  for (const b of bytes) {
    n = (n << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(n >>> bits) & 31];
    }
  }
  return out + (bits ? alphabet[(n << (5 - bits)) & 31] : "");
}
export function unpack(raw: string) {
  if (raw.length > maxCipher * 2) throw Error("Size");
  const s = raw.replace(/\s/g, "");
  if (!s || s.length > maxCipher || /[^A-Z2-7]/.test(s))
    throw Error("Alphabet");
  let n = 0,
    bits = 0;
  const out = [];
  for (const c of s) {
    n = (n << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((n >>> bits) & 255);
    }
  }
  const bytes = Uint8Array.from(out);
  if (pack(bytes) !== s) throw Error("Padding");
  return bytes;
}
export function crc(data: Uint8Array) {
  let n = -1;
  for (const b of data) {
    n ^= b;
    for (let i = 0; i < 8; i++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  }
  return ~n >>> 0;
}
export const groups = (s: string) => s.match(/.{1,3}/g)?.join(" ") ?? "";
const four = (n: number) =>
  [15, 10, 5, 0].map((shift) => alphabet[(n >>> shift) & 31]).join("");
export const provider = {
  encrypt(text: string, key: Uint8Array, iv: Uint8Array) {
    if (
      !text ||
      text.length > maxPlain ||
      !allowed.test(text) ||
      iv.length !== 8
    )
      throw Error("Message");
    const bytes = new TextEncoder().encode(text),
      body = new Uint8Array(6 + bytes.length),
      view = new DataView(body.buffer);
    view.setUint16(0, bytes.length);
    view.setUint32(2, crc(bytes));
    body.set(bytes, 6);
    return pack(Uint8Array.from([1, ...iv, ...cfb(key, iv, body)]));
  },
  decrypt(text: string, key: Uint8Array) {
    const bytes = unpack(text);
    if (bytes.length <= 15 || bytes[0] !== 1) throw Error("Envelope");
    const data = cfb(key, bytes.slice(1, 9), bytes.slice(9), true),
      v = new DataView(data.buffer),
      body = data.slice(6),
      plain = new TextDecoder().decode(body);
    if (
      v.getUint16(0) !== body.length ||
      !allowed.test(plain) ||
      crc(body) !== v.getUint32(2)
    )
      throw Error("Check");
    return plain;
  },
  challenge(ms: number, random: number) {
    return four((Math.floor(ms / 1000) & 32767) * 32 + (random & 31));
  },
  reply(challenge: string, ms: number, key: Uint8Array) {
    if (!/^[A-Z2-7]{4}$/.test(challenge)) throw Error("Challenge");
    const n = [...challenge].reduce((s, c) => 32 * s + alphabet.indexOf(c), 0),
      now = Math.floor(ms / 1000),
      delta = (((((n >>> 5) - now + 16384) % 32768) + 32768) % 32768) - 16384;
    let sec = BigInt(now + delta);
    if (Math.abs(delta) > 1200) sec = ~sec;
    return pack(block(key)(word64(sec * 32n + BigInt(n & 31)))).slice(0, 4);
  },
};
