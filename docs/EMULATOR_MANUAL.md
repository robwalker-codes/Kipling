# Using the workbench

## Meet the two terminals

Terminal 1 and Terminal 2 are separate devices on the same simulated link. Each has its own keyboard, clock, keys, paper and two message spaces called **A** and **B**. “Terminal 2, buffer A” means the first message space inside the second device. Nothing moves between devices until an operator transmits and the other operator has armed reception.

Start with the connector-audio link, clear conditions and both units off. Slot 01 on each device already contains the same **TRAINING** key. Follow **First exchange** in the device manual. The desk controls affect the simulation. The olive keyboard operates the device.

## Click, tap or type

Select a terminal by clicking its case or a key. A focus outline identifies the keyboard receiving your input. Press physical letters and digits just as you would press the corresponding key. You can also tab to each key and activate it. External inputs, including the manual search box, keep their own keyboard focus.

| Computer keyboard | KL-43C key | Effect |
|---|---|---|
| Enter / Space | ENTER / SPC | Confirm or insert a paragraph / insert a space |
| Escape | XIT | Finish editing, cancel a prompt or leave a function |
| Backspace / Delete | D CH / D WD | Delete the character to the left / the word to the right |
| Left / right arrows | < / > | Move one character or change clock field |
| Up / down arrows | ↑ / ↓ | Scroll, change a setting or move between display lines |
| Home / End | BOL / EOL | Beginning / end of the current display line |
| Ctrl+Home / Ctrl+End | BOT / EOT | Beginning / end of the message |

Click **SRCH** for power-on or editor search. **CLK** displays the clock. Hold the physical up arrow while clicking SRCH for startup contrast recovery. Press ↑ on the first key-list page for maximum contrast. Clicks and keyboard input follow the same device commands. Paste is available inside message editing and uses the same allowed characters and capacity rules. Invalid characters are ignored. A paste that exceeds remaining capacity leaves the draft intact and displays a warning. There is no shift layer.

On a narrow screen, scroll down to reach Terminal 2. Swipe the equipment horizontally if needed to reach keys at comfortable size. Reading the manual or switching focus leaves both devices running.

## Operate the link

**Connected** joins the simulated link. The port selector at each terminal chooses the one peripheral on its six-pin connector. Choose **Connector audio** on both terminals for the first exchange. Select **Digital** on both when using digital menus. Choose **Printer** before printing. Acoustic mode uses a separate path and requires normal device sound mode. Browser sound can stay muted.

**Conditions** controls the next transmission. Clear delivers the encoded frame. Correctable bit flips one transmitted bit and the receiver reconstructs it. Burst error exceeds the correction budget. Drop frame gives the listener no carrier. Lose carrier interrupts synchronisation. Choose Clear again before retrying. The seed picks the affected byte and bit. The event trace records what the bench observed. Local transmission completion alone cannot tell the sending operator what the other device received.

## Control time and power

Pause stops virtual time on both units. Step advances one second while paused. Speed changes how quickly the same deadlines arrive. Use a higher speed for long messages or slow digital rates. A backgrounded page pauses progression. Keep the page visible during an exercise.

The clock controls set each device's calendar time and drift in parts per million. Sync copies Terminal 1's time to Terminal 2. Device menu S changes the same RTC from the keyboard. CLK reads it. Ordinary ciphertext can be decrypted on a different date. The four-character authentication exercise also depends on clock agreement.

Low battery gives roughly four virtual minutes before shutdown. Replace batteries clears the low-battery condition and powers the unit down. Stored keys, committed buffers and clock survive a main-battery replacement. Persistent malfunction erases loaded keys and requires a reset. Clear the fault switch, then replace batteries or hold XIT for two seconds. Select factory reset to simulate a fresh unit with empty keys and buffers, a reset clock and the first-activation prompts. Factory reset and bench reset ask for confirmation.

## What survives

Ordinary device power-off retains committed buffers, stored keys, silent mode and RTC. The selected key must be chosen again after startup. Leaving the editor with XIT commits your changes. Interrupting an unfinished edit, cryptographic operation or transfer discards that unfinished work. Confirmed receive-buffer clearing takes effect immediately.

Reload starts a fresh in-memory training bench. Its synthetic keys are never saved in browser storage. Print output remains visible across device power cycles in the same page. Use the browser's print command from the manual for a paper copy of the instructions. The supplied scan and photographs are references and are not embedded in the application.

## Find a problem

| What you see | What to check | What to do next |
|---|---|---|
| Blank display | Unit is off or low batteries expired | Replace batteries if needed, press SRCH, then Y |
| Slot list returns | Slot number incomplete or outside 01–16 | Type both digits and ENTER |
| Waiting for Carrier / Data | Sender, route, rate, link, or selected port | Arm the receiver first; send again |
| Communications denied | Plaintext, hand-entered cipher, or silent acoustic path | Encrypt locally or select an appropriate path |
| Message does not decrypt properly | Key contents, update level, transcription | Keep the cipher, correct the key or re-enter the groups |
| Printer produces nothing | Port, plaintext confirmation, paused time | Select Printer, confirm with Y, resume time |
| No change after a key | Wrong terminal focus, transient notice, or paused operation | Read both LCD rows; check clock controls and focus |
