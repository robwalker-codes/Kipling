import { useState } from "react";
import Markdown from "react-markdown";
import gfm from "remark-gfm";
import { BookOpen, ChevronRight, Printer, Search } from "lucide-react";
import bench from "../docs/EMULATOR_MANUAL.md?raw";
import device from "../docs/DEVICE_MANUAL.md?raw";
const sections = [device, bench].map((text) =>
  text
    .split(/^## /m)
    .slice(1)
    .map((s) => ({
      title: s.slice(0, s.indexOf("\n")),
      body: s.slice(s.indexOf("\n")).trim(),
    })),
);
export function Manual({ initial = 0 }: { initial?: number }) {
  const [tab, setTab] = useState(initial),
    [chapter, setChapter] = useState(0),
    [query, search] = useState("");
  const chapters = sections[tab],
    matches = chapters
      .map((s, i) => ({ ...s, i }))
      .filter((s) =>
        (s.title + " " + s.body).toLowerCase().includes(query.toLowerCase()),
      );
  const selected = matches.find((s) => s.i === chapter) ?? matches[0];
  return (
    <main className="manual">
      <div className="titleBlock">
        <div>
          <small className="kicker">REFERENCE LIBRARY</small>
          <h1>Operating manual</h1>
          <p>
            Step-by-step instructions for the instrument and its simulated
            workbench.
          </p>
        </div>
        <button onClick={() => window.print()}>
          <Printer />
          Print this guide
        </button>
      </div>
      <div className="manualTabs">
        {["Device operator’s guide", "Emulator user guide"].map((s, i) => (
          <button
            key={s}
            aria-pressed={i === tab}
            onClick={() => {
              setTab(i);
              setChapter(0);
              search("");
            }}
          >
            <BookOpen />
            {s}
          </button>
        ))}
      </div>
      <div className="reader">
        <aside>
          <label className="search">
            <Search />
            <input
              placeholder="Find a topic"
              aria-label="Search guide"
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </label>
          {matches.map((s) => (
            <button
              key={s.i}
              className={s === selected ? "selected" : ""}
              onClick={() => setChapter(s.i)}
            >
              {s.title}
              <ChevronRight />
            </button>
          ))}
        </aside>
        <section className="chapter">
          {selected ? (
            <>
              <small className="kicker">
                {tab ? "EMULATOR USER GUIDE" : "DEVICE OPERATOR’S GUIDE"}
              </small>
              <h2>{selected.title}</h2>
              <Markdown remarkPlugins={[gfm]}>{selected.body}</Markdown>
            </>
          ) : (
            <p>No matching topic. Try “clock”, “printer” or “key”.</p>
          )}
        </section>
      </div>
      <div className="printManual">
        <Markdown remarkPlugins={[gfm]}>{tab ? bench : device}</Markdown>
      </div>
    </main>
  );
}
