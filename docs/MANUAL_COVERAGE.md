# Manual coverage and verification

The primary scan contains 68 PDF pages. The page index in [KL43C_SPEC.md](KL43C_SPEC.md) connects the printed numbering to PDF positions. OCR was used for navigation and the scan images were consulted for the display figures, warnings, abbreviated procedures and specifications. The independent LCD examples are in tests/fixtures/lcd.json. Comparisons ignore alignment whitespace where the simulator adapts the figure to forty cells. The machine map [manual-coverage.json](manual-coverage.json) records 99 requirement families, their evidence status, implementation files and named checks.

## Reproduce the checks

Run npm ci, npm run typecheck, npm run lint, npm test, npm run coverage and npm run build. Install Chromium for Playwright or supply CHROMIUM_PATH and run npm run e2e. The browser runner serves dist through a plain static HTTP server at the root and /exhibits/kl43/. The standalone HTML check blocks all secondary resource requests. Domain tests inject random bytes and advance virtual time directly. Browser tests use Playwright clock control. Coverage includes all four domain modules.

## Verified release build

The clean Node.js 24.22.1 installation passed type checking, linting, the production build, all 35 domain tests and all 11 Chromium browser tests. The domain modules reached 98.66% statement coverage and 97.68% branch coverage. The browser suite completed a two-terminal exchange using the packaged standalone HTML with secondary resource requests blocked.

## Appendix E cross-check

| Printed / PDF | Recipe | Executable transcript or procedure family |
|---|---|---|
| 59 / 58 | Create plain message; enter new key | First-exchange browser flow and factory/invalid/valid key entry; EDIT-07, KEY-01 through KEY-05 |
| 60 / 59 | Change, update, erase one, erase all | KEY-05, KEY-07–08, ZERO-01–04, including negative confirmations and retained buffers |
| 61 / 60 | Encrypt, decrypt, review | CRYPT-01–05 and REVIEW-01, including a multi-line read-only scrolling transcript |
| 62 / 61 | Print, feed, form feed; transmit audio by coupler and connector | PRINT-01–04, COM-01–02, independent manual routes, U.S./European choice, browser printer confirmation |
| 63 / 62 | Transmit digital; receive acoustic/connector | COM-01, COM-03, COM-08–11; available/full choices and per-direction ENTER |
| 64 / 63 | Receive digital; issue and answer a challenge | COM-01, COM-03, AUTH-01–08; manual challenge transport, matching and offset clocks |
| 65 / 64 | Power off | POWER-05–06; confirm, decline, cold restart, select stored key again |

## Interpreting the checks

The tests verify reconstructed behaviour. They cannot establish the original cipher, checksums, update transformation, on-air encoding, FEC or authentication algorithm. Independent FIPS example bytes were supplied with the brief and checked using OpenSSL; independent access to the NIST PDF was denied. Coverage reflects executable statements and branches, rather than the proportion of historical hardware reproduced. Visual inspection used Chromium desktop and a 390-pixel viewport. Physical touch hardware, Windows and WebKit were not exercised.

[Desktop](screenshots/desktop.png) · [Mobile](screenshots/mobile.png) · [Slot selection](screenshots/key-selection.png) · [Receive preparation](screenshots/receive.png) · [Operating manual](screenshots/manual.png)

## Requirement index

| Family | Printed pages | PDF pages | Implementation |
|---|---|---|---|
| POWER-01 to POWER-06 | 5–9, 46–47 | 8–12, 49–50 | src/kl/device.ts |
| MENU-01 to MENU-02 | 9–10 | 12–13 | src/kl/device.ts |
| KEY-01 to KEY-08 | 6–9, 15–17 | 9–12, 18–20 | src/kl/device.ts, src/kl/provider.ts |
| BUF-01 to BUF-04 | 10–14, 30–38, 67 | 13–17, 33–41, 65 | src/kl/editor.ts, src/kl/device.ts |
| EDIT-01 to EDIT-09 | 11–14 | 14–17 | src/kl/editor.ts, src/kl/device.ts |
| REVIEW-01 to REVIEW-01 | 21–22 | 24–25 | src/kl/device.ts |
| CRYPT-01 to CRYPT-11 | 15–21, 51 | 18–24, 52 | src/kl/provider.ts, src/kl/device.ts |
| COM-01 to COM-19 | 22–38, 51–55, 67 | 25–41, 52–56, 65 | src/kl/bench.ts, src/kl/device.ts |
| QUIET-01 to QUIET-03 | 39–40, 53–54 | 42–43, 54–55 | src/kl/device.ts |
| AUTH-01 to AUTH-08 | 40–42 | 43–45 | src/kl/provider.ts, src/kl/device.ts |
| TIME-01 to TIME-04 | 44–45 | 47–48 | src/kl/device.ts |
| ZERO-01 to ZERO-04 | 42–44 | 45–47 | src/kl/device.ts |
| PRINT-01 to PRINT-04 | 45–46, 51–53 | 48–49, 52–54 | src/kl/device.ts |
| VIEW-01 to VIEW-01 | 44 | 47 | src/kl/device.ts |
| BATT-01 to BATT-02 | 2–3, 54 | 6–7, 55 | src/kl/device.ts |
| FAULT-01 to FAULT-02 | 54, 57 | 55, 57 | src/kl/device.ts |
| UI-01 to UI-04 | 5–47, 67 | 8–50, 65 | src/main.tsx, src/style.css, src/kl/device.ts |
| STATE-01 to STATE-03 | 1–3, 46–47 | 5–7, 49–50 | src/kl/bench.ts, src/kl/device.ts |
| BUILD-01 to BUILD-02 | Deployment | — | package.json, package-lock.json, vite.config.ts, scripts/test-server.mjs |
| DOC-01 to DOC-02 | 1–70 | 5–68 | docs/KL43C_SPEC.md, docs/DEVICE_MANUAL.md, docs/EMULATOR_MANUAL.md |
