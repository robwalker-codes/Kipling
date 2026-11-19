# KIPLING Signals Lab

Operate two independent terminals, exchange messages across a virtual radio net and print the received traffic on a narrow roll. A third headquarters station features in the date-mismatch exercise. The simulator is a behavioural reconstruction grounded in the supplied historical evidence. Its equipment layout, radio timings and cryptography are modern interpretations.

## Run locally

Use Node.js 24 LTS and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the Vite address in a browser. Use localhost or HTTPS for Web Crypto. The application runs entirely in the browser. Its fonts, styles and runtime assets are bundled locally.

Select **Exercises → First exchange → Load exercise**. Press ALPHA's SEND key, look for ACKNOWLEDGED, then press READ at BRAVO and inspect its paper. For a blank draft use Free operation. Instructor includes a cold start, clock controls, diagnostic trace, fault injection, station setup and session import/export.

## Build and validate

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npx playwright install chromium
npm run e2e
```

Publish the contents of dist/ to a static web host. Playwright starts or reuses the local development server on port 5173. On a machine with a system Chromium installation, set CHROMIUM_PATH to its executable and skip the browser download. To test WebKit on a supported machine, install it with Playwright and run npm run e2e -- --browser=webkit with CHROMIUM_PATH unset.

## Implemented features

- Real encrypted DATA and ACK frames, receiver-local authentication, immutable send snapshots, correlated retries and duplicate suppression.
- A single virtual clock, half-duplex carriers, channel occupancy, deterministic collisions, seeded loss and explicit frame corruption.
- Eight guided exercises plus free operation, optional third station, independent clock and active epoch, and configurable local power and attachments.
- Keyboard, mobile input and onscreen editing. Enter inserts a line break. Ctrl+Enter or Command+Enter sends.
- Bounded stores, progressive printer spooling, paper replacement, jam repair, feed, tear-off, archived slips, selected-slip printing and original-body text export.
- Local session persistence and validated import/export. Reload and import restore records without loaded keys or radio replay.

## Validation and limits

The Vitest suite exercises the domain with virtual time and the real Web Crypto adapter. Playwright covers Chromium desktop input, two-station delivery, ACK, printing and reload, a 390-pixel HQ failure/repair flow, and cold-start attachment recovery. Desktop and mobile layouts and print rendering were inspected in Chromium. WebKit's browser binary download was denied by the environment's network policy. Mobile testing used a narrow Chromium viewport.

Each tab is an independent simulator. Backgrounding the page freezes virtual time. The evidence baseline contains no authenticated original firmware, complete interface manual or original cipher specification. This local teaching application uses synthetic keys and has no radio hardware interface.

## Documentation

- [Operator guide](docs/OPERATOR_GUIDE.md)
- [Historical evidence](docs/HISTORICAL_EVIDENCE.md) and [machine-readable claim register](src/evidence.json)
- [Reconstruction assumptions](docs/RECONSTRUCTION_ASSUMPTIONS.md)
- [Architecture and lifecycle](docs/ARCHITECTURE.md)
- [Simulation protocol](docs/SIMULATION_PROTOCOL.md)
