# Operating the KL-43C

## First exchange

Start on a fresh training bench with both ports set to Connector audio and conditions set to Clear. **Keys in a sequence are pressed one at a time.** A/B means choose one buffer. Wait for short notices to finish when a step names the next screen.

1. **Power both terminals.** On each, press **SRCH**, then **Y** within 15 seconds. When the four-slot list appears, press **0 → 1 → ENTER**. After the selected-key notice, the LCD shows the main menu beginning with W and Q.
2. **Write on Terminal 1.** Press **W → A → P**. At Enter Classification, press ENTER to leave it blank. Type **TEST MESSAGE FROM TERMINAL ONE**. Press **XIT**. The stored-message notice identifies A.
3. **Encrypt on Terminal 1.** Press **E → A → Y → Y**. The first Y confirms the current key. The second starts encryption. Wait for the main menu. A now holds ciphertext. **R → A** lets you inspect the groups. XIT leaves review.
4. **Arm Terminal 2 first.** Press **C → A → C → R → ENTER**. These letters select Communications, Audio, Connector and Receive. Look for **Waiting for Carrier...**. The unit selects the first available buffer, normally A.
5. **Transmit from Terminal 1.** Press **C → A → C → T → A → ENTER**. The last A selects the encrypted message. Wait for both displays to finish. On the sender, ENTER would retransmit. Press **XIT on both terminals** to return to the menus.
6. **Recover the text on Terminal 2.** Press **D → A → Y → Y**. Wait for the menu, then **R → A**. The original text should be visible. Press XIT.
7. **Make a paper copy.** Change Terminal 2's external port to **Printer**. Press **P → A → P**. Check the printer-only warning, then press **Y**. The paper advances. XIT returns to printer options; XIT again returns to the main menu. Reconnect connector audio before your next transfer.

If Communications offers to reuse a setup, press **N** to follow the complete sequences above. Choose **Y** to reuse the previous route and direction. This wording is reconstructed.

## Starting and selecting a key

SRCH is also ON. Answer the power question within 15 seconds. At the slot list, ↑ and ↓ page through 16 slots, four at a time. A slot shows its number, name and update level. AVAILABLE means empty. Type a two-digit number and ENTER. A loaded slot becomes the current key. An empty slot asks for a name.

Factory state adds ten digits and fifteen letters before the slot list. Enter each field and press ENTER. These training values have no assigned operational meaning. Set the reset clock with the arrow keys and XIT. A normal restart with a loaded key skips factory entry.

To load a key, choose an empty slot, enter a name of one to ten letters or digits, then ENTER. Enter each of the four groups on the training key card, pressing ENTER after each group. Use D CH to correct the current group. **Key is Invalid** returns to name entry. The same material can have different names and slot numbers on different units.

## Main menu reference

Press the function letter directly, even when it is offscreen. ↑ and ↓ scroll the list cyclically. XIT usually returns to the main menu. The original manual lists the following thirteen functions.

| Key | Function | Typical sequence |
|---|---|---|
| W | Word processor | W, buffer, P or C, enter text, XIT |
| Q | Quiet operation | Q, S for silent or N for normal |
| S | Set time and date | S, use arrows, XIT to set |
| K | Key change and entry | K, two-digit slot, ENTER |
| U | Update selected key | U, Y, Y, ENTER |
| E | Encrypt | E, buffer, Y, Y |
| D | Decrypt | D, buffer, Y, Y |
| A | Authentication | A, Y, C or R |
| P | Print | P, buffer, P, confirm plaintext |
| C | Communications | C, choose path and direction |
| R | Review | R, buffer, scroll, XIT |
| V | View angle | V, ↑ or ↓, XIT |
| O | Power off | O, Y to confirm or N to cancel |

## Compose, correct and review

W selects a buffer. If it already holds a message, Y clears that buffer; N keeps the message. Existing plaintext and locally entered cipher can be edited. To read device-encrypted or received cipher, use R. Starting a plain message prompts for an optional classification of up to 20 characters. ENTER finishes or skips that field. In this model a nonempty classification and its following paragraph break count against the 2600-character limit.

Type to insert before the cursor. ENTER starts a paragraph; the display wraps words automatically. BOT/EOT jump to the text boundaries. BOL/EOL go to the ends of a display line. The arrows move by character or display line. D CH removes the character to the left. D WD removes the word to the right. SRCH accepts up to 20 characters and ENTER searches forward from the cursor. A hit leaves the cursor after the match. BOT before SRCH searches from the beginning. XIT commits the editor and identifies the buffer.

Cipher entry accepts A–Z and 2–7 and displays automatic groups of three. To transfer a printed message by hand, choose W, an empty buffer, then C and copy every group. XIT stores it. Use D with the matching key. Direct electronic transmission of hand-entered cipher is denied. Decrypt, then encrypt again before transmitting. Review with R is read-only.

## Encryption and key updates

E and D operate locally on the selected buffer. Confirm the displayed key, then confirm the operation. Answer N at the key question for C to change or U to update. Answer N at Begin to leave the message as it was. Encryption replaces plaintext with cipher; successful decryption replaces cipher with plaintext. A failed check keeps the cipher available for recovery.

U asks two questions. N at either cancels. Successful update changes the effective material and increments the count. To exchange messages after updating, independently update the matching starting key on the other terminal to the same level. A label or clock adjustment cannot correct different key contents.

## Communications paths

| Path | Transmit from main menu | Receive from main menu |
|---|---|---|
| Connector audio | C A C T, buffer, ENTER | C A C R, ENTER |
| Acoustic coupler | C A A T, U or E, buffer, ENTER | C A A R, ENTER |
| Direct digital | C D T, buffer, select speed, ENTER, ENTER | C D R, handle storage, select speed, ENTER, ENTER |

U/E chooses U.S. or European lines in the acoustic transmit procedure. For digital operation use ↑/↓ at the speed prompt. Both units must use the same rate. The first ENTER confirms speed and the second starts or arms the operation. The equipment's audio modem specification is Bell 103 at 300 baud. The simulator models timing and bytes.

An empty buffer is chosen automatically for reception, A before B. If both are occupied, N aborts and keeps both. Y asks which buffer to clear. Only the selected buffer is cleared. Prepare and arm the receiver before transmitting. Completion at the sender indicates local completion. The receiving operator reads their own display, exits and decrypts explicitly. A failed frame leaves the other buffer intact. Use ENTER at the sender's completion prompt to retransmit the stored ciphertext after the listener arms again.

## Clock, quiet mode and verbal authentication

Q shows the current setting. S silences the device and prevents acoustic operation. N restores normal operation. Connector audio and direct digital remain available in silent mode. V changes LCD contrast with ↑/↓. CLK temporarily displays the RTC. Use CLK again or another key to leave the clock view. Clock access is inhibited during actual processing and radio transfer.

S opens the clock editor. Move between weekday, month, date, year, hour and minute with < and >. Use ↑/↓ to adjust. Weekday follows the calendar; adjusting that field moves the date. XIT commits and starts seconds at zero. The reconstruction uses UTC and Gregorian dates from 1970 through 2099.

For a verbal check, both operators select matching key material and update levels, with clocks within twenty minutes. Terminal 1 presses **A → Y → C**, reads the four-character challenge aloud and privately notes the expected reply. Terminal 2 presses **A → Y → R**, enters the four characters and ENTER, then reads its reply aloud. The first operator compares the two replies. XIT leaves either screen. This exercise uses an invented training algorithm. No challenge is carried automatically between terminals.

## Print, zeroise and shut down

P asks for buffer A or B. At printer options, P prints, L advances one line and F advances a form. Verify only the printer is connected before releasing plaintext with Y. XIT stops an active job; already printed characters remain on paper. Changing the port during a job interrupts it.

**ZRO is destructive after confirmation.** For one slot, press ZRO, enter the two-digit number, ENTER, then Y. N cancels. For all slots, press ZRO, A, then Y. All keys and both messages are erased. A alone only selects the option. During startup ZRO can lead directly to the all-key confirmation. An erased active key requires a new selection. A malfunction clears keys, while this reconstruction retains committed buffers until all-zeroise or factory reset.

O asks for confirmation. N keeps the device on. Y powers down. Use SRCH and select the key again next time. The manual describes four AA cells and a backup cell for RAM and the clock. The browser has a separate session lifetime, explained in the workbench guide.

## Sources and fidelity

The operating procedures follow TRW, KL-43C Operator's Manual, part 410-308-1, Revision F, 15 August 1991. The introductory material is printed pp. 1–3, operating instructions pp. 5–47, warnings pp. 51–54, verbal transfer p. 55, troubleshooting p. 57 and condensed recipes pp. 59–65. The five Crypto Museum photographs supplied with the request inform the outline, display and legends. The original cipher, key validation, update derivation, authentication algorithm and transmission framing are undocumented here. The simulator's training material works within this application only.

## Reading the front panel

The LCD has two lines of forty characters. Only two menu entries fit at once; the other functions remain available by letter. The small row beneath the display contains the text navigation and correction keys. The far-right key in that row, SRCH, has two jobs: power-on when the unit is off and string search inside the editor. The tall key on the right is ENTER. XIT beside it leaves the current operation. The zero with a slash on the number row enters the digit zero.

A portable unit contains its own two message buffers. Encrypting in A replaces its clear content. Use B for a separate draft you want to retain. A received message stays in ciphertext until an operator successfully decrypts it. One slot number selects one of sixteen **keys**; the letters A and B select **messages**. If the display is asking for a key ID, entering A does not select a message.

## Recover from a warning

- **CIPHER TEXT IN BUFFER** follows an attempt to encrypt ciphertext. Review the buffer, or use D to recover the plaintext first.
- **PLAIN TEXT IN BUFFER** means the selected message is already clear. Use R to read it or E to prepare it for electronic transmission.
- **MESSAGE SPACE IS EMPTY** means that buffer has no committed message. Check the other buffer or enter text using W and finish with XIT.
- **MEMORY SPACE FOR MESSAGE IS NOT EMPTY** means both buffers are occupied. N preserves both and aborts. Y asks which one to clear. Read or print anything you need before clearing it.
- **MESSAGE DOES NOT DECRYPT PROPERLY** means the check failed. Keep the ciphertext. Verify matching key material and update counts; check any hand-entered groups. Repeat D after correcting the cause.
- **FAILURE TO ESTABLISH COMMUNICATIONS** means the selected path could not be used or a listener timed out. Check both port choices, the link, rate, receiver-ready display and elapsed virtual time.
- **LOSS OF SYNCHRONIZATION** or **UNCORRECTABLE ERRORS** means reception failed. Press XIT, restore the link, arm the receiver again, then retransmit from the sender.
- **CIPHER TEXT HAS BEEN LOCALLY ENTERED** or **MESSAGE IN PLAIN TEXT FORM** prevents electronic transmission. Hand-entered cipher must be decrypted and re-encrypted. Plaintext needs encryption.
- **QUIET OPERATION: AUDIO OUTPUT DENIED** blocks the acoustic coupler. Use connector audio, digital or Q then N.
- **LOW BATTERY WARNING** gives time to finish an operation before shutdown. **MALFUNCTION! DO NOT USE** clears keys. On the bench, remove the injected fault, reset, restart and re-enter training material. A real unit's service procedure belongs to its equipment custodian.
