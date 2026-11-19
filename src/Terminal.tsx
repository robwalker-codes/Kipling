import { useRef, useState, useLayoutEffect } from "react";
import {
  Antenna,
  Printer,
  SlidersHorizontal,
  ArrowUpRight,
  Delete,
  CornerDownLeft,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Scissors,
  FileText,
  ChevronsUp,
} from "lucide-react";
import {
  type Props,
  Lamp,
  Modal,
  Setup,
  PowerKey,
  PrinterControls,
  download,
} from "./Controls";
import { spool, printerState } from "./engine";
import { encode, profile, utc } from "./profile";
export function Terminal({ sim, s, update, num }: Props & { num: number }) {
  const [mode, setMode] = useState<"ready" | "compose" | "read" | "stored">(
      "ready",
    ),
    [panel, setPanel] = useState(""),
    [idx, setIndex] = useState(0),
    [symbols, setSymbols] = useState(false),
    [ime, setComposition] = useState<string | null>(null),
    [slip, setSlip] = useState(-1);
  const edit = useRef<HTMLTextAreaElement>(null),
    cursor = useRef<[number, number]>([0, 0]),
    place = useRef(false),
    lcd = useRef<HTMLDivElement>(null);
  const q = s.printer,
    rs = s.inbox,
    records = mode === "stored" ? s.saved : rs,
    rec = records[Math.min(idx, records.length - 1)];
  const time = utc(sim.time + s.offset),
    unread = rs.filter((m) => m.unread).length;
  useLayoutEffect(() => {
    if (place.current && edit.current) {
      edit.current.focus();
      edit.current.setSelectionRange(...cursor.current);
      place.current = false;
    }
  });
  function change(value: string, pos: number) {
    try {
      s.draft = encode(value);
      s.notice = "COMPOSING";
      cursor.current = [pos, pos];
      place.current = true;
      sim.dirty = true;
    } catch (e) {
      s.notice = (e as Error).message;
    }
    update();
  }
  function action(k: string) {
    try {
      if (!s.power || s.boot) return;
      if (k === "SETUP") {
        setPanel("setup");
        return;
      }
      if (k === "COMPOSE") {
        setMode("compose");
        place.current = true;
        s.notice = "COMPOSING";
      } else if (k === "BACK") {
        setMode("ready");
        s.notice = "READY";
      } else if (k === "STORE") {
        sim.store(s);
        setMode("stored");
        setIndex(s.saved.length - 1);
      } else if (k === "READ") {
        setMode("read");
        setIndex(Math.max(0, rs.length - 1));
        if (rs.length) rs[rs.length - 1].unread = false;
        s.notice = rs.length ? "READING" : "INBOX EMPTY";
      } else if (k === "SAVED") {
        setMode("stored");
        setIndex(0);
        s.notice = "TRANSMIT STORE";
      } else if (k === "SEND" || k === "RETRY") {
        if (k === "SEND" && mode === "stored" && rec) {
          s.draft = rec.body;
          s.address = rec.to;
        }
        sim.send(s, k === "RETRY");
        setMode("ready");
      } else if (k === "PRINT") {
        if (mode !== "read" || !rec) throw Error("SELECT RECEIVED MESSAGE");
        if (!spool(s, rs[Math.min(idx, rs.length - 1)], true))
          throw Error("PRINT QUEUE FULL");
        s.notice = "PRINT QUEUED";
      } else if (
        (mode === "stored" || mode === "read") &&
        ["LEFT", "RIGHT", "ENTER", "DELETE"].includes(k)
      ) {
        if (!rec) throw Error("STORE EMPTY");
        if (k === "DELETE") {
          records.splice(records.indexOf(rec), 1);
          setIndex(0);
          s.notice = "MESSAGE DELETED";
        } else if (k === "ENTER" && mode === "stored") {
          s.draft = rec.body;
          s.address = rec.to;
          setMode("compose");
          cursor.current = [s.draft.length, s.draft.length];
          place.current = true;
        } else {
          const n = Math.max(
            0,
            Math.min(records.length - 1, idx + (k === "LEFT" ? -1 : 1)),
          );
          setIndex(n);
          if (mode === "read") rs[n].unread = false;
        }
      } else {
        let [a, b] = edit.current
          ? [edit.current.selectionStart, edit.current.selectionEnd]
          : cursor.current;
        setMode("compose");
        if (k === "LEFT" || k === "RIGHT") {
          const n =
            k === "LEFT" ? Math.max(0, a - 1) : Math.min(s.draft.length, b + 1);
          cursor.current = [n, n];
          place.current = true;
        } else {
          const insert =
            k === "ENTER"
              ? "\n"
              : k === "SPACE"
                ? " "
                : ["CLEAR", "DELETE"].includes(k)
                  ? ""
                  : k;
          if (k === "CLEAR") {
            a = 0;
            b = s.draft.length;
          }
          if (k === "DELETE" && a === b) a = Math.max(0, a - 1);
          change(
            s.draft.slice(0, a) + insert + s.draft.slice(b),
            a + insert.length,
          );
        }
      }
      sim.dirty = true;
    } catch (e) {
      s.notice = (e as Error).message;
    }
    update();
  }
  const sendRetry =
    s.last && ["NO ACK", "SENT UNCONFIRMED"].includes(s.last.state);
  function key(k: string, node?: React.ReactNode, cls = "") {
    return (
      <button
        key={k}
        className={"key " + cls}
        aria-label={k}
        disabled={!s.power || s.boot}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => action(k)}
      >
        {node || k}
      </button>
    );
  }
  const sheet = slip < 0 ? q.sheet : q.archive[slip] || [];
  function paperText() {
    return sheet.join("\n");
  }
  return (
    <article className="station" aria-label={"Station " + s.label}>
      <div className="stationTitle">
        <span className="number">0{num}</span>
        <h2>Station {s.label.charAt(0) + s.label.slice(1).toLowerCase()}</h2>
        <span className="nettag">
          <i />
          NET {s.channel}
        </span>
      </div>
      <div className="equipment">
        <i className="screw tl" />
        <i className="screw tr" />
        <i className="screw bl" />
        <i className="screw br" />
        <div className="faceTitle">
          <b>KIPLING</b>
          <span>DATA ENTRY TERMINAL</span>
          <PowerKey
            on={s.power}
            label={s.label + " terminal"}
            action={() => {
              sim.togglePower(s);
              setMode("ready");
              update();
            }}
          />
        </div>
        <div className="bezel">
          <div className={"lcd " + (!s.power ? "dark" : "")} ref={lcd}>
            {s.power && (
              <>
                <div className="lcdtop">
                  <span>
                    {s.call} / NET {s.channel}
                  </span>
                  <span>{time.slice(11, 16)} Z</span>
                </div>
                {s.boot ? (
                  <strong>SELF TEST …</strong>
                ) : mode === "compose" ? (
                  <textarea
                    rows={profile.rows}
                    cols={profile.columns}
                    aria-label={s.call + " message body"}
                    ref={edit}
                    spellCheck={false}
                    value={ime ?? s.draft}
                    onCompositionStart={() => setComposition(s.draft)}
                    onCompositionEnd={(e) => {
                      setComposition(null);
                      change(
                        e.currentTarget.value,
                        e.currentTarget.selectionStart,
                      );
                    }}
                    onChange={(e) =>
                      ime !== null
                        ? setComposition(e.target.value)
                        : change(e.target.value, e.target.selectionStart)
                    }
                    onSelect={(e) => {
                      cursor.current = [
                        e.currentTarget.selectionStart,
                        e.currentTarget.selectionEnd,
                      ];
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        action("SEND");
                      }
                      if (e.key === "Escape") action("BACK");
                    }}
                    placeholder="ENTER MESSAGE…"
                  />
                ) : mode === "read" || mode === "stored" ? (
                  <div className="readout" tabIndex={0}>
                    {rec ? (
                      <>
                        {rec.id} · {rec.from} → {rec.to}
                        <br />
                        {rec.body}
                      </>
                    ) : mode === "read" ? (
                      "INBOX EMPTY"
                    ) : (
                      "TRANSMIT STORE EMPTY"
                    )}
                  </div>
                ) : (
                  <div className="lcdready">
                    <strong>
                      {!s.key
                        ? "KEY REQUIRED"
                        : s.notice === "READY"
                          ? "TERMINAL READY"
                          : s.notice}
                    </strong>
                    <span>
                      {s.draft ? "DRAFT IN MEMORY" : "AWAITING COMMAND"}{" "}
                      <b className="cursor" />
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="lampbar">
          <Lamp on={s.power} label="PWR" />
          <Lamp on={!!sim.air.find((f) => f.source === s)} label="TX" />
          <Lamp on={unread > 0} label={"RX" + (unread ? " " + unread : "")} />
          <Lamp on={!!s.key && s.power} label="KEY" />
          <span role="status">{s.notice}</span>
        </div>
        <div className="keybed">
          <div className="functions">
            {["SETUP", "COMPOSE", "STORE", "SEND", "READ", "PRINT"].map((k) =>
              key(k, undefined, k === "SEND" ? "orange" : "function"),
            )}
          </div>
          <div className="keys">
            {(symbols
              ? ["1234567890", ".,!?'\"():/", "+%=&#@*;-"]
              : ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]
            ).map((row) => (
              <div className="keyrow" key={row}>
                {[...row].map((k) => key(k))}
                {row === "ZXCVBNM" && key("DELETE", <Delete size={15} />)}
              </div>
            ))}
            <div className="keyrow last">
              <button
                className="key"
                onClick={() => setSymbols(!symbols)}
                aria-label="Toggle punctuation"
              >
                {symbols ? "ABC" : "#+="}
              </button>
              {key("LEFT", <ArrowLeft size={14} />)}
              {key("SPACE")}
              {key("RIGHT", <ArrowRight size={14} />)}
              {key(
                "ENTER",
                <>
                  <CornerDownLeft size={12} /> ENT
                </>,
              )}
              {symbols && key("DELETE", <Delete size={14} />)}
            </div>
          </div>
        </div>
        <div className="underkeys">
          {key("BACK")}
          {key("CLEAR")}
          {key("SAVED", "TX STORE")}
          <span>
            {s.draft.length} / {profile.bodyLimit}
          </span>
        </div>
      </div>
      <div className="route">
        {mode === "read" && rec && (
          <button onClick={() => download(rec.id + ".txt", rec.body)}>
            Export body
          </button>
        )}
        <label>
          Address{" "}
          <select
            aria-label={s.label + " recipient"}
            value={s.address}
            onChange={(e) => {
              s.address = e.target.value;
              sim.dirty = true;
              update();
            }}
          >
            {Array.from(
              new Set([
                ...sim.stations.filter((x) => x !== s).map((x) => x.call),
                s.address,
                "*",
              ]),
            ).map((a) => (
              <option key={a} value={a}>
                {a === "*" ? "BROADCAST" : a}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => action("RETRY")} disabled={!sendRetry}>
          Retry snapshot <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="attachment">
        <div className="porticon">
          <Antenna />
        </div>
        <div>
          <small>RADIO ATTACHMENT</small>
          <h3>Clansman bearer</h3>
        </div>
        <button
          aria-label={s.call + " radio controls"}
          className="attachmentStatus"
          onClick={() => setPanel("radio")}
        >
          <Lamp
            on={s.radio && s.cable}
            label={!s.cable ? "UNPLUGGED" : s.radio ? "LINKED" : "OFF"}
          />
          <SlidersHorizontal size={14} />
        </button>
      </div>
      <div className="attachment">
        <div className="porticon">
          <Printer />
        </div>
        <div>
          <small>PRINT ATTACHMENT</small>
          <h3>Roll-paper printer</h3>
        </div>
        <button
          aria-label={s.call + " printer controls"}
          className="attachmentStatus"
          onClick={() => setPanel("printer")}
        >
          <Lamp on={printerState(q) === "ONLINE"} label={printerState(q)} />
          <SlidersHorizontal size={14} />
        </button>
      </div>
      <div className="printertray">
        <div className="slot" />
        <pre className="paper" aria-label="Paper output">
          {q.sheet.length ? q.sheet.slice(-10).join("\n") : <span>· · ·</span>}
        </pre>
      </div>
      <div className="paperactions">
        <button
          onClick={() => {
            if (
              q.on &&
              q.connected &&
              !q.jam &&
              q.paper &&
              q.sheet.length < profile.sheetLines
            ) {
              q.sheet.push("");
              q.paper--;
              sim.dirty = true;
            }
            update();
          }}
        >
          <ChevronsUp />
          Feed
        </button>
        <button
          disabled={!q.sheet.length}
          onClick={() => {
            if (q.archive.length >= profile.archiveSlips) {
              s.notice = "PAPER ARCHIVE FULL";
              update();
              return;
            }
            q.archive.push(q.sheet);
            q.sheet = [];
            sim.dirty = true;
            update();
          }}
        >
          <Scissors />
          Tear off
        </button>
        <button
          onClick={() => {
            setSlip(-1);
            setPanel("slips");
          }}
        >
          <FileText />
          Paper archive <ChevronDown />
        </button>
      </div>
      {panel === "setup" && (
        <Setup sim={sim} s={s} update={update} close={() => setPanel("")} />
      )}
      {panel === "radio" && (
        <Modal title={s.label + " radio attachment"} close={() => setPanel("")}>
          <div className="settings">
            {(["radio", "cable"] as const).map((k) => (
              <label key={k} className="check">
                <input
                  type="checkbox"
                  checked={s[k]}
                  onChange={(e) => {
                    sim.invalidate(s);
                    s[k] = e.target.checked;
                    update();
                  }}
                />
                {k === "radio" ? "Radio power" : "Cable connected"}
              </label>
            ))}
            <label>
              Link conditions
              <select
                value={s.loss}
                onChange={(e) => {
                  s.loss = Number(e.target.value);
                  update();
                }}
              >
                {profile.losses.map((l, i) => (
                  <option value={l} key={l}>
                    {["Clear", "Marginal", "Poor"][i]} · {100 * l}% loss
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}
      {panel === "printer" && (
        <Modal title={s.label + " printer controls"} close={() => setPanel("")}>
          <PrinterControls sim={sim} s={s} update={update} />
        </Modal>
      )}
      {panel === "slips" && (
        <Modal title={s.label + " paper archive"} close={() => setPanel("")}>
          <label>
            Paper selection
            <select value={slip} onChange={(e) => setSlip(+e.target.value)}>
              <option value={-1}>Current paper</option>
              {q.archive.map((_, i) => (
                <option key={i} value={i}>
                  Torn slip {i + 1}
                </option>
              ))}
            </select>
          </label>
          <pre className="slip">{paperText() || "Blank paper"}</pre>
          <div className="actions">
            <button
              disabled={!sheet.length}
              onClick={() => download(s.call + "-slip.txt", paperText())}
            >
              Export text
            </button>
            <button disabled={!sheet.length} onClick={() => window.print()}>
              Print slip
            </button>
            <button
              disabled={slip < 0}
              onClick={() => {
                if (confirm("Delete this torn slip?")) {
                  q.archive.splice(slip, 1);
                  setSlip(-1);
                  update();
                }
              }}
            >
              Delete slip
            </button>
          </div>
        </Modal>
      )}
    </article>
  );
}
