const utf = new TextEncoder();
export type Header = readonly [
  1,
  "DATA" | "ACK",
  string,
  string,
  string,
  string,
  string,
];
export type RadioEnvelope = {
  header: Header;
  nonce: Uint8Array<ArrayBuffer>;
  cipher: ArrayBuffer;
};
async function derive(
  root: Uint8Array<ArrayBuffer>,
  net: string,
  epoch: string,
) {
  const seed = await crypto.subtle.importKey("raw", root, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: utf.encode("KIPLING-SIM-v1"),
      info: utf.encode(JSON.stringify(["traffic", net, epoch])),
    },
    seed,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function seal(
  root: Uint8Array<ArrayBuffer>,
  epoch: string,
  header: Header,
  text: string,
): Promise<RadioEnvelope> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(root, header[6], epoch);
  const cipher = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: nonce,
      additionalData: utf.encode(JSON.stringify(header)),
      tagLength: 128,
    },
    key,
    utf.encode(text),
  );
  return { header, nonce, cipher };
}
export async function open(
  root: Uint8Array<ArrayBuffer>,
  epoch: string,
  net: string,
  frame: RadioEnvelope,
) {
  const key = await derive(root, net, epoch);
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: frame.nonce,
        additionalData: utf.encode(JSON.stringify(frame.header)),
        tagLength: 128,
      },
      key,
      frame.cipher,
    ),
  );
}
