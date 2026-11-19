# Architecture

The React workspace owns one Simulation object. Both terminals operate on it, including when one is out of view. A UI action changes its local station or submits a send. React rendering has no delivery side effects.

- src/profile.ts defines limits, encoding, UTC handling and wrap rules.
- src/engine.ts owns stations, independent stores, scenarios, radio attempts, the event queue, collision intervals and printer jobs.
- src/crypto.ts implements authenticated encryption. Its inputs are header, payload and the local station's current root and epoch.
- src/storage.ts defines the versioned Zod schema and explicit export/restore mapping. Restoring never schedules a radio replay. Local storage access errors leave the live simulation available.
- src/Terminal.tsx implements the equipment controls and accessible editing surface. src/Controls.tsx owns setup drafts, modal dialogs, switches and export. src/main.tsx connects virtual time, persistence, instructor controls and scenarios.
- src/evidence.json links claim IDs to categories and source locators. Source access status is independent of claim category.

## Scheduling invariants

All radio intervals are half-open. Events sort by virtual deadline then insertion sequence. Endpoints must remain eligible across an entire frame. Sender and eligible receiver revisions are captured at start. Invalidation remains effective across a quick reconnection. An additional same-channel transmission marks both active frames as collided. A collision on DATA or ACK cannot confirm a message.

Crypto begins after airtime inputs, fault outcomes and recipients have been fixed in the send operation. The scheduler awaits encryption and receiver authentication at the corresponding completion boundary. A running advance cannot re-enter. Disposing a simulation invalidates its pending asynchronous completions, events and future printing. This keeps browser crypto latency out of the simulated timeout calculation.

The browser adapter requests a fixed virtual step when visible and running. It skips missed intervals, pauses in the background and resumes from the last virtual instant. Simulation speed scales the requested step, while events remain ordered by virtual deadlines. Browser suspension itself is outside the radio model.

Each receive acceptance can independently change the inbox, unread flag, ACK schedule and print queue. The printer consumes elapsed virtual line deadlines up to each scheduler event. A stalled job retains its next line index. A torn sheet has its own lifetime. Reading never causes an ACK.

## Changing a profile

Change shared constants and corresponding schema bounds together. Update reconstruction register claims, the assumptions table and edge-case tests for the new limits. A change to header encoding or derivation inputs requires a new protocol version. Incompatible persisted records require a new storage version and migration or explicit recovery. Run the production build, domain tests and the browser flow after changes.
