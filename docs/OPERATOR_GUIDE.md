# Operating the terminals

## First exchange

Open **Exercises → First exchange → Load exercise**. ALPHA has the synthetic water-container request in its draft. Press COMPOSE to inspect it. Choose BRAVO in Address, then SEND. On a clear net ALPHA goes through TRANSMITTING and AWAITING ACK before ACKNOWLEDGED. At BRAVO the RX lamp counts unread messages. READ opens the latest receipt. Its body remains available even if the roll is empty. The strip advances one line at a time.

Free operation starts with two compatible, powered stations and blank drafts. In Instructor, **Start with equipment off** starts a fresh exercise. Use the terminal power switch, radio attachment controls and printer controls to power each component. The terminal performs a short self-test. On a phone, use the labelled station tabs. Both endpoints continue operating while either tab is open.

## Input and stores

Press COMPOSE for a native editing field. Type, paste, use a mobile keyboard, or press the faceplate keys. Enter inserts a line break. Ctrl+Enter or Command+Enter sends while composing. Escape leaves composition. Use #+= for punctuation. Unsupported input is rejected as one edit with a status message. The character counter includes newlines.

STORE copies the current draft to a transmit slot. TX STORE opens the saved list. Use the arrows to move through records. ENTER copies the selected saved message to the editor. DELETE removes the selected record in a store and backspaces in composition. CLEAR clears the draft. READ opens the receive store. PRINT queues a labelled reprint. Export body saves the selected received text with its original line breaks.

SEND creates a fresh message identity. Retry snapshot resends the previous unconfirmed snapshot to its original address even if the draft has changed. An ACK confirms storage. Reading and printing are separate operations. Broadcast addresses every eligible receiver and finishes unconfirmed.

## Recovering an exchange

- **Stale headquarters date.** Load Headquarters date. Send from ALPHA to BRAVO, then change Address to HQ and send again. Compare the sender's NO ACK with HQ's UNREADABLE FRAME. In HQ SETUP set the clock to 15 June 1998, check Apply station date to key epoch and save. Retry the snapshot at ALPHA. This exercise interprets a reported date-related problem using a modern key derivation model.
- **Wrong key.** Load Different training keys. After a failed send, choose Load shared exercise key at BRAVO and save. Retry at ALPHA. The instructor can inspect the event trace without exposing the message in the trace.
- **Radio failure.** Use the radio attachment controls to disconnect a cable or turn the bearer off. A local disconnect prevents transmission. A receiving-side disconnect causes silence and a sender timeout. A channel mismatch also causes silence. Restore power, connection and matching channels before sending again.
- **Lost ACK.** Load Lost acknowledgement and send. BRAVO accepts and automatically prints once. Wait for NO ACK at ALPHA and retry. The authenticated duplicate earns another ACK while the original receive record is retained.
- **Busy channel and collision.** Load Busy net and collision. Pause in Instructor. Occupy channel starts a BRAVO frame. Return to Operator and press SEND at ALPHA to see NET BUSY. Resume and allow the channel and ACK to clear. Force collision starts both stations at the same virtual instant. After the timeouts, send one at a time.
- **Printer and memory.** Load Paper and memory and send. BRAVO acknowledges and queues the slip with an empty roll. Replace roll to resume. Fill BRAVO's RX store in Instructor, then send a new message. After the timeout, READ and DELETE one record at BRAVO and retry from ALPHA.
- **Date rollover.** Load Midnight rollover. The clock starts one second before midnight. Step or run across midnight and apply the new date at ALPHA only. Send, inspect the failure, then apply the same date at BRAVO and retry.

## Paper and sessions

Printer controls expose power, cable, automatic printing, jam and roll replacement. A jam or an empty roll pauses the current line queue. Feed advances a blank line. Tear off moves the printed portion to the archive, including a partial job if it is still printing. Open Paper archive to select, export, print or delete a slip. Export text preserves fixed-width paper wrapping. Export body in READ preserves the original message formatting.

Sessions save locally by default. After reload, use SETUP at each endpoint to load the shared exercise key. The active epoch remains visible. Pending radio attempts restore as unconfirmed. Import and export live under Instructor. The default export contains configuration. Include messages and printouts explicitly to export the plaintext records, draft and paper.
