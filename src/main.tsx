import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AudioLines,
  BookOpen,
  ChevronRight,
  Clock3,
  FlaskConical,
  History,
  Layers2,
  Monitor,
  Pause,
  Play,
  RadioTower,
  Settings2,
  SkipForward,
  SquareTerminal,
  Volume2,
  VolumeX,
} from "lucide-react";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-600.css";
import "./style.css";
import { Simulation, scenarios } from "./engine";
import { profile, utc } from "./profile";
import { restore, serialize } from "./storage";
import { Modal, Setup, download } from "./Controls";
import { Terminal } from "./Terminal";
import evidence from "./evidence.json";
const storageKey = "kipling-field-session-v1";
function initial() {
  try {
    const text = localStorage.getItem(storageKey);
    return {
      sim: text ? restore(text) : new Simulation(),
      error: "",
      persist: localStorage.getItem(storageKey + "-disabled") !== "1",
    };
  } catch {
    return {
      sim: new Simulation(),
      error: "Saved session unavailable or malformed. A fresh session is open.",
      persist: false,
    };
  }
}
function App() {
  const [generation, setGeneration] = useState(0);
  const [start] = useState(initial),
    [sim, replace] = useState(start.sim),
    [, rerender] = useState(0),
    [view, viewSet] = useState("operator"),
    [modal, setModal] = useState(""),
    [pick, setStation] = useState(0),
    [error, setError] = useState(start.error),
    [persist, setPersist] = useState(start.persist),
    [include, setInclude] = useState(false),
    [sound, setSound] = useState(false),
    [large, setLarge] = useState(false),
    [contrast, setContrast] = useState(false),
    [setup, setSetup] = useState(-1),
    [scenario, setScenario] = useState(sim.scenario);
  const audio = useRef<AudioContext | null>(null);
  const update = () => rerender((x) => x + 1);
  function replaceSim(n: Simulation) {
    sim.dispose();
    setGeneration((x) => x + 1);
    replace(n);
    setStation(0);
    setScenario(n.scenario);
    setSetup(-1);
    setModal("");
    setError("");
  }
  function discard() {
    return (
      !sim.dirty ||
      confirm("Replace this session and its messages and printouts?")
    );
  }
  function load(index: number, off = false) {
    if (!discard()) return;
    const n = new Simulation(index);
    if (off)
      n.stations.forEach((s) => {
        s.power = false;
        s.radio = false;
        s.printer.on = false;
        s.notice = "POWER OFF";
      });
    replaceSim(n);
  }
  useEffect(() => {
    let live = true;
    const timer = setInterval(async () => {
      if (document.hidden || sim.paused || !live) return;
      await sim.advance(100 * sim.speed);
      if (live) update();
    }, 100);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [sim]);
  useEffect(() => {
    if (!persist) return;
    function save() {
      try {
        const data = serialize(sim, true);
        if (data.length > 2e6) throw Error();
        localStorage.setItem(storageKey, data);
      } catch {
        setError("Local save unavailable. Export the session to keep a copy.");
        setPersist(false);
      }
    }
    const t = setInterval(save, 1500);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(t);
      window.removeEventListener("pagehide", save);
    };
  }, [sim, persist]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  function chirp(e: React.MouseEvent) {
    if (!sound || !audio.current || !(e.target as Element).closest(".key"))
      return;
    const a = audio.current,
      o = a.createOscillator(),
      g = a.createGain();
    o.frequency.value = 390;
    g.gain.value = 0.018;
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.035);
  }
  async function soundSwitch() {
    try {
      if (!audio.current) audio.current = new AudioContext();
      await audio.current.resume();
      setSound(!sound);
    } catch {
      setError("Audio unavailable");
    }
  }
  const count = sim.stations.length,
    clock = utc(sim.time);
  return (
    <div
      className={(large ? "large " : "") + (contrast ? "contrast" : "")}
      onClick={chirp}
    >
      <header>
        <div className="headinner">
          <div className="brand">
            <span className="brandmark">
              <AudioLines size={24} />
            </span>
            KIPLING
            <span className="brandline" /> <small>Signals Lab</small>
          </div>
          <nav aria-label="Workspace view">
            <button
              className={view === "operator" ? "active" : ""}
              onClick={() => viewSet("operator")}
            >
              <SquareTerminal />
              Operator
            </button>
            <button
              className={view === "instructor" ? "active" : ""}
              onClick={() => viewSet("instructor")}
            >
              <Settings2 />
              Instructor
            </button>
          </nav>
          <button className="guide" onClick={() => setModal("guide")}>
            <BookOpen size={16} />
            Operator guide
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">
              <span className="rule" />
              CLANSMAN DATA SYSTEMS
            </div>
            <h1>
              {view === "operator"
                ? "Terminal workspace"
                : "Instructor console"}
            </h1>
            <p>
              {view === "operator"
                ? "Operate connected field terminals on a shared simulated radio net."
                : "Configure station equipment, inject faults and inspect the simulated net."}
            </p>
          </div>
          <div className="recon">
            <span />
            Behavioural reconstruction
          </div>
        </div>
        <div className="network">
          <div>
            <div className="tileicon">
              <RadioTower />
            </div>
            <section>
              <small>RADIO MEDIUM</small>
              <strong>
                {sim.air.length ? "Carrier active" : "Net standing by"}
              </strong>
            </section>
          </div>
          <div>
            <div className="tileicon">
              <Layers2 />
            </div>
            <section>
              <small>STATIONS</small>
              <strong>
                {sim.stations.filter((s) => s.power).length} / {count} powered
              </strong>
            </section>
          </div>
          <div>
            <div className="tileicon">
              <Clock3 />
            </div>
            <section>
              <small>SIMULATION CLOCK</small>
              <strong>
                {clock.slice(11, 19)} <em>UTC</em>
              </strong>
            </section>
          </div>
          <button onClick={() => setModal("exercise")}>
            <FlaskConical />
            Exercises
            <ChevronRight />
          </button>
        </div>
        {error && (
          <div role="alert" className="alert">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}
        {sim.scenario > 0 && (
          <div className="exercise">
            <b>{scenarios[sim.scenario][0]}</b> {scenarios[sim.scenario][1]}
          </div>
        )}
        {view === "operator" ? (
          <>
            <div className={"stationTabs " + (count === 3 ? "three" : "")}>
              {sim.stations.map((s, i) => (
                <button
                  key={s.label}
                  className={pick === i ? "sel" : ""}
                  onClick={() => setStation(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className={"rack " + (count === 3 ? "third" : "")}>
              {sim.stations.map((s, i) => (
                <div
                  className={pick === i ? "selected" : ""}
                  key={s.label + "-" + sim.scenario}
                >
                  <Terminal
                    key={generation}
                    sim={sim}
                    s={s}
                    num={i + 1}
                    update={update}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="console">
            <section>
              <h2>
                <Clock3 />
                Simulation control
              </h2>
              <p>{clock.replace("T", " ").slice(0, 19)} UTC</p>
              <div className="actions">
                <button
                  onClick={() => {
                    sim.paused = !sim.paused;
                    update();
                  }}
                >
                  {sim.paused ? <Play /> : <Pause />}
                  {sim.paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={async () => {
                    sim.paused = true;
                    await sim.advance(1000);
                    update();
                  }}
                >
                  <SkipForward />
                  Step 1 s
                </button>
                <label>
                  Speed{" "}
                  <select
                    value={sim.speed}
                    onChange={(e) => {
                      sim.speed = +e.target.value;
                      update();
                    }}
                  >
                    {[1, 2, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}×
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button onClick={() => setModal("exercise")}>
                Select exercise
              </button>
            </section>
            <section>
              <h2>
                <RadioTower />
                Medium faults
              </h2>
              <div className="settings">
                {(["dropData", "dropAck", "corrupt"] as const).map((k, i) => (
                  <label className="check" key={k}>
                    <input
                      type="checkbox"
                      checked={sim[k]}
                      onChange={(e) => {
                        sim[k] = e.target.checked;
                        update();
                      }}
                    />
                    {
                      ["Drop next DATA", "Drop next ACK", "Corrupt next frame"][
                        i
                      ]
                    }
                  </label>
                ))}
              </div>
              <div className="actions">
                {["Occupy channel", "Force collision"].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => {
                      try {
                        const [a, b] = sim.stations;
                        for (const s of i ? [a, b] : [b]) {
                          if (!s.draft) s.draft = "CHANNEL CHECK";
                          sim.send(s, false, !!i);
                        }
                        update();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2>
                <Settings2 />
                Station configuration
              </h2>
              {sim.stations.map((s, i) => (
                <div className="stationSettings" key={s.label}>
                  <b>{s.call}</b>
                  <small>
                    {s.epoch} · {s.key ? "KEY LOADED" : "NO KEY"}
                  </small>
                  <div className="actions">
                    <button onClick={() => setSetup(i)}>Setup</button>
                    <button
                      onClick={() => {
                        sim.fill(s);
                        update();
                      }}
                    >
                      Fill RX store
                    </button>
                  </div>
                </div>
              ))}
            </section>
            <section>
              <h2>
                <Activity />
                Event trace
              </h2>
              <div className="trace">
                {sim.trace.map((l, i) => (
                  <div key={i}>
                    <time>{utc(l.time).slice(11, 19)}</time> {l.text}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2>
                <Monitor />
                Display & session
              </h2>
              <div className="settings">
                {["Enlarged LCD text", "High contrast display"].map(
                  (label, i) => (
                    <label className="check" key={i}>
                      <input
                        type="checkbox"
                        checked={i ? contrast : large}
                        onChange={(e) =>
                          (i ? setContrast : setLarge)(e.target.checked)
                        }
                      />
                      {label}
                    </label>
                  ),
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={persist}
                    onChange={(e) => {
                      const value = e.target.checked;
                      try {
                        localStorage.setItem(
                          storageKey + "-disabled",
                          value ? "0" : "1",
                        );
                        if (!value) localStorage.removeItem(storageKey);
                        setPersist(value);
                      } catch {
                        setError("Storage unavailable");
                      }
                    }}
                  />
                  Save session locally
                </label>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(storageKey);
                      localStorage.setItem(storageKey + "-disabled", "1");
                      setPersist(false);
                    } catch {
                      setError("Storage unavailable");
                    }
                  }}
                >
                  Erase saved session
                </button>
                <button onClick={() => load(0, true)}>
                  Start with equipment off
                </button>
              </div>
            </section>
            <section>
              <h2>
                <FileIcon />
                Import & export
              </h2>
              <label className="check">
                <input
                  type="checkbox"
                  checked={include}
                  onChange={(e) => setInclude(e.target.checked)}
                />
                Include messages and printouts
              </label>
              <div className="actions">
                <button
                  onClick={() =>
                    download(
                      "kipling-session.json",
                      serialize(sim, include),
                      "application/json",
                    )
                  }
                >
                  Export session
                </button>
              </div>
              <label>
                Import session
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      if (f.size > 2e6) throw Error();
                      const n = restore(await f.text());
                      if (discard()) replaceSim(n);
                      else n.dispose();
                    } catch {
                      setError("Invalid or oversized session file.");
                    }
                  }}
                />
              </label>
            </section>
          </div>
        )}
        <footer>
          <span>
            <i />
            LOCAL SIMULATION
          </span>
          <div>
            <button onClick={soundSwitch}>
              {sound ? <Volume2 /> : <VolumeX />}Sound {sound ? "on" : "off"}
            </button>
            <button onClick={() => setModal("history")}>
              <History />
              History & accuracy
            </button>
          </div>
        </footer>
      </main>
      {setup >= 0 && (
        <Setup
          sim={sim}
          s={sim.stations[setup]}
          update={update}
          close={() => setSetup(-1)}
        />
      )}
      {modal === "exercise" && (
        <Modal title="Training exercises" close={() => setModal("")}>
          <label>
            Exercise
            <select
              aria-label="Exercise"
              value={scenario}
              onChange={(e) => setScenario(+e.target.value)}
            >
              {scenarios.map(([name], i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <p>{scenarios[scenario][1]}</p>
          <button className="primary" onClick={() => load(scenario)}>
            Load exercise
          </button>
        </Modal>
      )}
      {modal === "guide" && (
        <Modal title="Operator guide" close={() => setModal("")}>
          <ol>
            <li>
              At Station Alpha, press <b>COMPOSE</b>. Type a message. Enter
              starts a new line.
            </li>
            <li>
              Select BRAVO as the address. Press <b>SEND</b> or Ctrl+Enter.
              Watch for ACKNOWLEDGED.
            </li>
            <li>
              At Bravo, press <b>READ</b>. The printer feeds automatically. Tear
              off the slip to archive it.
            </li>
          </ol>
          <p>
            STORE saves a draft. TX STORE opens it. Use the arrows to browse,
            ENTER to edit, DELETE to remove a selected record. BACK returns to
            standby.
          </p>
          <p>
            For a missed ACK, inspect the radio, channel, training key and
            active date. Repair setup, then choose Retry snapshot. Use printer
            controls to replace paper or clear a jam.
          </p>
          <button
            className="primary"
            onClick={() => {
              setScenario(1);
              setModal("exercise");
            }}
          >
            First exchange exercise <ChevronRight size={15} />
          </button>
        </Modal>
      )}
      {modal === "history" && (
        <Modal title="History & accuracy" close={() => setModal("")}>
          <p>
            KIPLING provided security for tactical data transmissions using
            Clansman. This behavioural reconstruction uses modern substitute
            cryptography for a local teaching simulation. Both endpoints are
            visible to the instructor.
          </p>
          <p>
            Source details below come from the supplied research baseline. The
            linked documents could not be independently verified here.
          </p>
          {evidence.claims.map((c) => (
            <details key={c.id}>
              <summary>
                {c.subject} <small>{c.category}</small>
              </summary>
              <p>{c.claim}</p>
              <small>
                {c.consequence} · {c.source}
              </small>
            </details>
          ))}
          <details>
            <summary>Adjustable reconstruction profile</summary>
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </details>
          <h3>Sources</h3>
          {Object.entries(evidence.sources).map(([k, v]) => (
            <p key={k}>
              <a href={v.urls[0]} target="_blank" rel="noreferrer">
                {k} · {v.title}
              </a>{" "}
              {v.locator}
            </p>
          ))}
        </Modal>
      )}
    </div>
  );
}
const FileIcon = BookOpen;
createRoot(document.getElementById("root")!).render(
  globalThis.crypto?.subtle ? (
    <App />
  ) : (
    <p>Web Crypto unavailable. Open the terminal over HTTPS or localhost.</p>
  ),
);
