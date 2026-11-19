import { useState, type ReactNode, useEffect, useRef } from "react";
import { X, Power } from "lucide-react";
import { Simulation, type Station } from "./engine";
import { parseUTC, utc, profile } from "./profile";
export type Props = { sim: Simulation; s: Station; update: () => void };
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog aria-label={title} ref={ref} onCancel={close}>
      <div className="modalHead">
        <h2>{title}</h2>
        <button onClick={close} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Lamp({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={"lamp " + (on ? "lit" : "")}>
      <i />
      {label}
    </span>
  );
}
export function Setup({
  sim,
  s,
  update,
  close,
}: Props & { close: () => void }) {
  const [call, setCall] = useState(s.call),
    [net, setNet] = useState(s.net),
    [channel, setChannel] = useState(s.channel),
    [date, setDate] = useState(utc(sim.time + s.offset).slice(0, 19)),
    [apply, setApply] = useState(false),
    [key, setKey] = useState("keep"),
    [error, setError] = useState("");
  const [initial] = useState(date);
  function save() {
    try {
      const t = parseUTC(date);
      if (!/^[A-Z0-9-]{1,12}$/.test(net)) throw Error("INVALID NET");
      sim.rename(s, call);
      if (net !== s.net || channel !== s.channel || apply || key !== "keep")
        sim.invalidate(s);
      if (date !== initial) sim.dirty = true;
      Object.assign(s, { net, channel });
      if (date !== initial) s.offset = t - sim.time;
      if (apply) s.epoch = utc(sim.time + s.offset).slice(0, 10);
      if (key === "shared") s.key = sim.training.slice();
      if (key === "other") s.key = crypto.getRandomValues(new Uint8Array(32));
      if (key === "clear") s.key = null;
      s.notice = s.key ? "SETUP SAVED" : "KEY REQUIRED";
      update();
      close();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Modal title={s.label + " station setup"} close={close}>
      <div className="formgrid">
        <label>
          Callsign
          <input
            value={call}
            onChange={(e) => setCall(e.target.value.toUpperCase())}
          />
        </label>
        <label>
          Logical net
          <input
            value={net}
            onChange={(e) => setNet(e.target.value.toUpperCase())}
          />
        </label>
        <label>
          Radio channel
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            {["01", "02", "03", "04"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Station clock · UTC
          <input
            type="datetime-local"
            step="1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Training key
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            <option value="keep">
              Keep current · {s.key ? "loaded" : "empty"}
            </option>
            <option value="shared">Load shared exercise key</option>
            <option value="other">Load different key</option>
            <option value="clear">Clear key</option>
          </select>
        </label>
        <label>
          Active key date<output>{s.epoch}</output>
        </label>
      </div>
      <label className="check">
        <input
          type="checkbox"
          checked={apply}
          onChange={(e) => setApply(e.target.checked)}
        />
        Apply station date to key epoch
      </label>
      <p role="alert">{error}</p>
      <div className="actions">
        <button onClick={close}>Cancel</button>
        <button className="primary" onClick={save}>
          Save setup
        </button>
      </div>
    </Modal>
  );
}
export function PowerKey({
  on,
  action,
  label,
}: {
  on: boolean;
  action: () => void;
  label: string;
}) {
  return (
    <button
      className={"switch " + (on ? "on" : "")}
      aria-label={label + " power"}
      aria-pressed={on}
      onClick={action}
    >
      <Power size={13} />
      {on ? "ON" : "OFF"}
    </button>
  );
}
export function PrinterControls({ s, update }: Props) {
  const q = s.printer;
  return (
    <div className="settings">
      {(["connected", "on", "auto", "jam"] as const).map((k, i) => (
        <label className="check" key={k}>
          <input
            type="checkbox"
            checked={q[k]}
            onChange={(e) => {
              q[k] = e.target.checked;
              update();
            }}
          />
          {
            ["Cable connected", "Power on", "Automatic printing", "Paper jam"][
              i
            ]
          }
        </label>
      ))}
      <button
        onClick={() => {
          q.paper = profile.roll;
          update();
        }}
      >
        Replace roll
      </button>
      <small>{q.paper} printable lines remaining</small>
    </div>
  );
}
export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
