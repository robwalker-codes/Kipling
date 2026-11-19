# Reconstruction assumptions

The adjustable defaults live in src/profile.ts under kipling-reconstruction-v1. Evidence register groups R01–R05 identify these choices as reconstruction. No original firmware or complete operator handbook was available.

| Area | Implemented choice |
|---|---|
| Enclosure and controls | Olive metal treatment, simulated screws, membrane-style keys, separate attachments, lamps and reconstructed screen vocabulary. |
| Display | Nominal 40-column, four-row editorial display. Text scrolls in an editable native field. Available width, accessibility settings and viewport affect the physically visible characters. |
| Encoding | ASCII upper/lower-case Latin input converted to uppercase, digits, spaces, LF and punctuation shown by the #+= keyboard. CRLF and CR become LF. Unsupported characters or a body over 1,000 characters reject the edit. |
| Memory | Ten transmit slots plus one active draft, twenty receive slots. Explicit deletion frees a slot. Each new SEND creates a snapshot. |
| Airtime | DATA occupies 1,200 ms plus 30 ms per normalized character. ACK waits 300 ms and occupies 400 ms. Wait for ACK up to 3,000 ms after DATA ends. Manual retries. |
| Radio | Four abstract channels. Same-channel overlapping frames collide throughout their reception. No capture effect. A local cable, power or setup change invalidates the attempt and any in-progress reception. |
| Loss | Transmitter link preset governs the entire frame. Clear, marginal and poor select 0%, 10% and 30%. One deterministic uniform draw per frame at start, independent of the encryption RNG. Explicit drop/corrupt flags also consume at frame start. |
| Epoch | June 15, 1998 at 09:00 UTC starts most exercises. Each station has an offset and separately applied active epoch. Date rollover never automatically changes the epoch. Reported faults motivate this model. |
| Printer | Fixed 40-character wrapping, preserving blank lines and splitting long words. One line every 180 virtual ms, 120 lines per roll. Queue position survives power and paper faults. A full print queue leaves the accepted message in memory for later manual reprint. |
| Power | A 600 ms terminal self-test. Within the page, switching terminal power off retains the draft, messages, setup, key and paper. Power interruptions cancel in-flight work. Clearing a key drops the station reference. JavaScript provides no forensic memory-erasure guarantee. |
| Session | One local session per origin in the required single-page mode. Versioned, validated local snapshots, with a 2 MB application size ceiling. Local reload restores plaintext records and paper, excludes keys, cancels radio events and requires deliberate operator action to send. Configuration-only exports are the default. |
| Audio | Optional synthesized key clicks. Their timing and pitch are an interpretation. |

See SIMULATION_PROTOCOL.md for the modern cryptography and routing rules. Manufacturer, exact screen and key legends, electrical pinouts, cipher, modulation, paper stock and compatibility with particular radio models remain unknown.
