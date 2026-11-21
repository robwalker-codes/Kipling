import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  AudioLines,
  BookOpen,
  Cable,
  ChevronDown,
  Clock3,
  KeyRound,
  PanelTop,
  Pause,
  Play,
  Printer,
  Radio,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./style.css";
import { Bench, impairments, type Noise } from "./kl/bench";
import { Device, type Port } from "./kl/device";
import { training } from "./kl/provider";
import { Manual } from "./Manual";
const rows = [
  ["BOT", "EOT", "↓", "↑", "<", ">", "BOL", "EOL", "D CH", "D WD", "SRCH"],
  [..."1234567890()"],
  [..."QWERTYUIOP-", "ENTER"],
  ["ZRO", ..."ASDFGHJKL/", "XIT"],
  ["CLK", ..."ZXCVBNM,.?", "SPC"],
];
const mappings: Record<string, string> = {
  Enter: "ENTER",
  Escape: "XIT",
  Backspace: "D CH",
  Delete: "D WD",
  " ": "SPC",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "<",
  ArrowRight: ">",
  Home: "BOL",
  End: "EOL",
};
const createBench = () =>
  new Bench((n) => crypto.getRandomValues(new Uint8Array(n)));
function routeOptions() {
  return (
    <>
      <option value="connector">Connector audio</option>
      <option value="digital">Digital</option>
      <option value="printer">Printer</option>
      <option value="disconnected">Disconnected</option>
    </>
  );
}
function Face({
  d,
  id,
  refresh,
  press,
  port,
}: {
  d: Device;
  id: number;
  refresh: () => void;
  press: (d: Device, k: string) => void;
  port: (p: Port) => void;
}) {
  const heldUp = useRef(false),
    hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  };
  useEffect(() => cancelHold, []);
  const run = (key: string) =>
    press(d, key === "SRCH" && heldUp.current ? "↑+SRCH" : key);
  function keydown(e: KeyboardEvent) {
    if (e.altKey || e.metaKey) return;
    if (e.ctrlKey && !["Home", "End"].includes(e.key)) return;
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target instanceof HTMLButtonElement
    )
      return;
    const key = e.ctrlKey
      ? e.key === "Home"
        ? "BOT"
        : "EOT"
      : (mappings[e.key] ??
        (/^[a-z0-9(),.\-/?]$/i.test(e.key) ? e.key.toUpperCase() : ""));
    if (!key) return;
    e.preventDefault();
    if (key === "↑") heldUp.current = true;
    if (e.repeat && ["ENTER", "XIT"].includes(key)) return;
    if (key === "XIT" && d.mode === "fault")
      hold.current = setTimeout(() => run("HOLD XIT"), 2000);
    run(key);
  }
  const display = d.display();
  const position =
    d.mode === "edit" && !d.clockView ? d.editor.position() : null;
  const cursorRow = position ? Math.min(1, position.line) : -1;
  return (
    <article className="station" aria-label={"Terminal " + id}>
      <div className="stationHead">
        <h2>
          <span className="terminalIcon">
            <PanelTop />
          </span>
          Terminal {id}
        </h2>
        <span className={"state " + (d.mode !== "off" ? "powered" : "")}>
          <i />
          {d.mode === "off"
            ? "Powered off"
            : d.mode === "fault"
              ? "Malfunction"
              : "Powered on"}
        </span>
      </div>
      <div className="deviceSurface">
        <div
          className="case"
          tabIndex={0}
          role="group"
          aria-label={"Terminal " + id + " keyboard"}
          onKeyDown={keydown}
          onKeyUp={(e) => {
            if (e.key === "ArrowUp") heldUp.current = false;
            if (e.key === "Escape") cancelHold();
          }}
          onBlur={() => {
            heldUp.current = false;
            cancelHold();
          }}
          onPaste={(e) => {
            if (d.mode === "edit") {
              e.preventDefault();
              d.paste(e.clipboardData.getData("text"));
              refresh();
            }
          }}
        >
          <div className="window">
            <div
              className={"glass " + (d.mode === "off" ? "sleep" : "")}
              style={{ color: "hsl(70 24% " + (42 - 3 * d.contrast) + "%)" }}
              role="status"
              aria-label={"Terminal " + id + " LCD"}
            >
              {display.map((line, i) => (
                <div key={i}>
                  {position && cursorRow === i ? (
                    <>
                      {line.slice(0, Math.min(39, position.col))}
                      <u>{line[Math.min(39, position.col)]}</u>
                      {line.slice(Math.min(39, position.col) + 1)}
                    </>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
          </div>
          <span className="maker">TRW</span>
          <div className="keyMatrix">
            {rows.map((row, i) => (
              <div key={i} className={"keyRow row" + i}>
                {row.map((k) => (
                  <button
                    key={k}
                    type="button"
                    tabIndex={0}
                    aria-label={k}
                    className={"cap " + (k === "ENTER" ? "enter" : "")}
                    onPointerDown={(e) => {
                      if (k === "↑") heldUp.current = true;
                      if (k === "XIT" && d.mode === "fault")
                        hold.current = setTimeout(() => run("HOLD XIT"), 2000);
                      if (e.pointerType === "mouse") e.preventDefault();
                    }}
                    onPointerUp={() => {
                      if (k === "↑") heldUp.current = false;
                      cancelHold();
                    }}
                    onPointerCancel={cancelHold}
                    onClick={(e) => {
                      if (e.detail > 0)
                        e.currentTarget
                          .closest<HTMLElement>(".case")
                          ?.focus({ preventScroll: true });
                      run(k);
                    }}
                  >
                    {k === "0" ? "Ø" : k}
                  </button>
                ))}
                {i === 0 && <span className="onmark">ON</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="portline">
        <Cable />
        <label>
          Port{" "}
          <select
            aria-label={"Terminal " + id + " port"}
            value={d.port}
            onChange={(e) => {
              port(e.target.value as Port);
              refresh();
            }}
          >
            {routeOptions()}
          </select>
        </label>
        <span>
          <Clock3 />
          {new Date(d.rtc).toISOString().slice(11, 19)}
        </span>
      </div>
      {d.port === "printer" || d.paper ? (
        <details className="paperBox" open>
          <summary>
            <Printer />
            Printer output
          </summary>
          {d.paper ? (
            d.paper.split("\f").map((page, index) => (
              <pre key={index} aria-label={"Paper page " + (index + 1)}>
                {page || " "}
              </pre>
            ))
          ) : (
            <pre>Paper ready</pre>
          )}
        </details>
      ) : null}
    </article>
  );
}
function RtcField({ device, number }: { device: Device; number: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = new Date(device.rtc).toISOString().slice(0, 19);
  return (
    <label>
      RTC (UTC)
      <input
        type="datetime-local"
        step="1"
        min="1970-01-01T00:00"
        max="2099-12-31T23:59:59"
        aria-label={"Terminal " + number + " clock"}
        value={draft ?? value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => {
          const ms = e.target.valueAsNumber;
          if (
            draft !== null &&
            Number.isFinite(ms) &&
            ms >= 0 &&
            ms < Date.UTC(2100, 0)
          )
            device.rtc = ms;
          setDraft(null);
        }}
      />
    </label>
  );
}
function App() {
  const [bench, replace] = useState(createBench),
    [, redraw] = useState(0),
    [view, setView] = useState<"bench" | "manual">("bench"),
    [chapter, setChapter] = useState(0),
    [card, setCard] = useState(false),
    [sound, setSound] = useState(false),
    [advanced, setAdvanced] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    alarms = useRef([0, 0]);
  const refresh = () => redraw((x) => x + 1);
  const [migration] = useState(() => {
    try {
      const key = "kipling-field-session-v1";
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        localStorage.removeItem(key + "-disabled");
        return true;
      }
    } catch {
      /* storage is optional */
    }
    return false;
  });
  function tone(hz: number) {
    if (!audio.current || !sound) return;
    const ctx = audio.current,
      o = ctx.createOscillator(),
      gain = ctx.createGain();
    o.frequency.value = hz;
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.connect(gain);
    gain.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.09);
  }
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !bench.paused) bench.step(100 * bench.speed);
      refresh();
    }, 100);
    return () => clearInterval(timer);
  }, [bench]);
  useEffect(() => {
    if (card) dialog.current?.showModal();
    else dialog.current?.close();
  }, [card]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    bench.devices.forEach((d, i) => {
      if (alarms.current[i] !== d.alarms && !d.quiet) tone(190);
      alarms.current[i] = d.alarms;
    });
  });
  function manual(index: number) {
    setChapter(index);
    setView("manual");
    window.scrollTo(0, 0);
  }
  function reset() {
    if (
      confirm(
        "Reset both terminals, messages, keys and paper to the starting training setup?",
      )
    ) {
      replace(createBench());
      alarms.current = [0, 0];
    }
  }
  return (
    <>
      <header>
        <div className="headerFrame">
          <div className="brand">
            <span>
              <AudioLines />
            </span>
            Signals Lab
          </div>
          <span className="brandDivider" />
          <nav aria-label="Primary">
            <button
              aria-current={view === "bench" ? "page" : undefined}
              onClick={() => setView("bench")}
            >
              <PanelTop />
              Workbench
            </button>
            <button
              aria-current={view === "manual" ? "page" : undefined}
              onClick={() => manual(0)}
            >
              <BookOpen />
              Operating manual
            </button>
          </nav>
          <span className="local">
            <i />
            Local simulation
          </span>
        </div>
      </header>
      {view === "manual" ? (
        <Manual key={chapter} initial={chapter} />
      ) : (
        <main>
          <div className="titleBlock">
            <div>
              <small className="kicker">
                <span />
                CRYPTOGRAPHIC EQUIPMENT
              </small>
              <h1>KL-43C workbench</h1>
              <p>
                Operate two portable message encryptors across a simulated link.
              </p>
            </div>
            <button className="bookButton" onClick={() => manual(0)}>
              <BookOpen />
              Quick start
              <ArrowRight />
            </button>
          </div>
          <div className="benchbar">
            <div className="mediumLabel">
              <Radio />
              <strong>Radio link</strong>
            </div>
            <label className="connected">
              <input
                aria-label="Link connected"
                type="checkbox"
                checked={bench.connected}
                onChange={(e) => {
                  bench.setLink(e.target.checked);
                  refresh();
                }}
              />
              <i />
              {bench.connected ? "Connected" : "Disconnected"}
            </label>
            <label className="conditions">
              Conditions{" "}
              <select
                value={bench.noise}
                onChange={(e) => {
                  bench.noise = e.target.value as Noise;
                  refresh();
                }}
              >
                {impairments.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <div className="timeControls">
              <button
                aria-label={bench.paused ? "Resume clock" : "Pause clock"}
                onClick={() => {
                  bench.paused = !bench.paused;
                  refresh();
                }}
              >
                {bench.paused ? <Play /> : <Pause />}
              </button>
              <button
                aria-label="Step one second"
                onClick={() => {
                  bench.paused = true;
                  bench.step(1000);
                  refresh();
                }}
              >
                <SkipForward />
              </button>
              <select
                aria-label="Clock speed"
                value={bench.speed}
                onChange={(e) => {
                  bench.speed = +e.target.value;
                  refresh();
                }}
              >
                {[1, 2, 5, 10, 50].map((n) => (
                  <option value={n} key={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rack">
            {bench.devices.map((d, i) => (
              <Face
                key={i}
                d={d}
                id={i + 1}
                port={(p) => bench.port(d, p)}
                refresh={refresh}
                press={(unit, k) => {
                  if (!unit.quiet) tone(440);
                  unit.press(k);
                  refresh();
                }}
              />
            ))}
          </div>
          <div className="startStrip">
            <div className="stripIcon">
              <BookOpen />
            </div>
            <div>
              {bench.devices.some((d) => d.mode === "off") ? (
                <>
                  <h3>Power up a terminal</h3>
                  <p>
                    Press <kbd>SRCH</kbd> then <kbd>Y</kbd>. Select key{" "}
                    <kbd>01</kbd> and press <kbd>ENTER</kbd>.
                  </p>
                </>
              ) : (
                <>
                  <h3>Compose a message</h3>
                  <p>
                    At the main menu, press <kbd>W</kbd>, choose buffer{" "}
                    <kbd>A</kbd> or <kbd>B</kbd>, then <kbd>P</kbd> for
                    plaintext.
                  </p>
                </>
              )}
            </div>
            <button onClick={() => setCard(true)}>
              <KeyRound />
              Training key card
            </button>
          </div>
          <button
            className="drawer"
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal />
            <b>Bench controls</b>
            <span>Clocks, equipment & faults</span>
            <ChevronDown />
          </button>
          {advanced && (
            <section className="settings">
              <div className="general">
                <label>
                  Impairment seed
                  <input
                    type="number"
                    min={0}
                    max={4294967295}
                    value={bench.seed}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber;
                      if (Number.isInteger(n) && n >= 0 && n <= 4294967295)
                        bench.seed = n;
                      refresh();
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    bench.devices[1].rtc = bench.devices[0].rtc;
                    refresh();
                  }}
                >
                  Synchronise clocks
                </button>
                <button
                  onClick={async () => {
                    if (!sound) {
                      audio.current ??= new AudioContext();
                      await audio.current.resume();
                    }
                    setSound(!sound);
                  }}
                >
                  {sound ? <Volume2 /> : <VolumeX />}Sound{" "}
                  {sound ? "on" : "off"}
                </button>
                <button onClick={reset}>Reset bench</button>
              </div>
              <div className="faultGrid">
                {bench.devices.map((d, i) => (
                  <fieldset key={i}>
                    <legend>Terminal {i + 1}</legend>
                    <RtcField device={d} number={i + 1} />
                    <label>
                      Drift (ppm)
                      <input
                        type="number"
                        min="-1000"
                        max="1000"
                        value={d.drift}
                        onChange={(e) => {
                          const n = e.target.valueAsNumber;
                          if (Number.isFinite(n) && Math.abs(n) <= 1000)
                            d.drift = n;
                          refresh();
                        }}
                      />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={d.fault}
                        onChange={(e) => {
                          d.fault = e.target.checked;
                          if (d.fault && d.mode !== "off") d.malfunction();
                          refresh();
                        }}
                      />
                      Persistent malfunction
                    </label>
                    <div className="actions">
                      <button
                        onClick={() => {
                          d.low();
                          refresh();
                        }}
                      >
                        Low battery
                      </button>
                      <button
                        onClick={() => {
                          d.replaceBattery();
                          d.unset = true;
                          refresh();
                        }}
                      >
                        Reset RTC
                      </button>
                      <button
                        onClick={() => {
                          d.replaceBattery();
                          refresh();
                        }}
                      >
                        Replace cells
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Erase this terminal’s keys and buffers and enable first activation?",
                            )
                          )
                            d.factoryReset();
                          refresh();
                        }}
                      >
                        Factory reset
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
              <details>
                <summary>
                  <Activity />
                  Event log
                </summary>
                <pre>{bench.trace.join("\n") || "No transmissions yet."}</pre>
              </details>
            </section>
          )}
          <div className="manualLinks">
            <div>
              <BookOpen />
              <h3>Operating manuals</h3>
            </div>
            <button onClick={() => manual(1)}>
              Emulator user guide <ArrowRight />
            </button>
            <button onClick={() => manual(0)}>
              Device operator’s guide <ArrowRight />
            </button>
          </div>
          {migration && (
            <p>
              The earlier KIPLING browser session used a different model. This
              bench started fresh.
            </p>
          )}
          <details className="accuracy">
            <summary>
              Sources & accuracy <ChevronDown />
            </summary>
            <p>
              The interface follows TRW’s KL-43C Operator’s Manual, Revision F
              (15 August 1991), and the supplied Crypto Museum photographs. The
              1992 photographed firmware and the British KIPLING designation
              have separate provenance. The training key format, DES-CFB8
              provider, radio framing and error correction are simulator
              designs.{" "}
              <a href="https://www.cryptomuseum.com/crypto/usa/kl43/">
                Crypto Museum equipment reference
              </a>
              .
            </p>
          </details>
        </main>
      )}
      <footer>
        KL-43C operator reconstruction. Original cipher undocumented; this build
        uses a DES-based training substitute and simulated radio framing. Not
        for protecting real information.
      </footer>
      <dialog ref={dialog} onCancel={() => setCard(false)}>
        <div className="dialogHead">
          <h2>Training key card</h2>
          <button aria-label="Close card" onClick={() => setCard(false)}>
            <X />
          </button>
        </div>
        <p>
          Both terminals start with this material in slot 01, named TRAINING, at
          update level 00.
        </p>
        <div className="keyCard">
          {training.match(/.{8}/g)?.map((s, i) => (
            <p key={i}>
              <small>SET {i + 1}</small>
              <code>{s}</code>
            </p>
          ))}
        </div>
        <p>
          For an empty slot, enter a name, press ENTER, then type each set
          followed by ENTER. Use D CH to correct the current set.
        </p>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
