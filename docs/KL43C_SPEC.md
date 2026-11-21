# KL-43C operator reconstruction specification

The target is the TRW KL-43C in the supplied Operator's Manual, 410-308-1, Rev. F, 15 August 1991. The photographs show the device from the front, at an angle, at the connector, at the battery cover and from the rear. The relation of this exact model to the local name “Kipling” remains unverified. Historical source status and the simulated implementation are different attributes.

## Page index and device model

Page references below give **printed pages / one-based PDF pages**. Use the PDF reader's page-number field with the second range. Open the supplied document locally. The source scan and the watermarked photographs are external to the released application.

| Section | Printed / PDF | Behaviour and state |
|---|---|---|
| Cover, warranty, contents | i–iv / 1–4 | Identifies TRW, document number, revision, accessory cables and chapter order. Warranty and historical service addresses are documentary material. |
| General description, security, power | 1–3 / 5–7 | Offline portable text encryptor, two buffers, insert/wrap/search, manually keyed traffic, independent RTC and optional printer. Paper tape carried key/supersession information. NTISSI 3001A is referenced; its doctrine was not supplied. |
| Turning on, key selection | 5–9 / 8–12 | Off → SRCH → confirmation → self-test/banner → factory or slot selection. Sixteen independent slots. Enter two digits and ENTER. Empty slots enter name and four groups. An accepted key selects the slot; an invalid key returns to name entry. |
| Menu, buffers, word processing | 9–15 / 12–18 | Thirteen listed shortcuts; cyclic display. W chooses a buffer; a separate editor transaction commits on XIT. Empty, plain, typed cipher, encrypted cipher and received cipher are distinct states. |
| Key change/update, transforms, review | 15–22 / 18–25 | Change chooses another slot. Update confirms twice. E and D choose buffer, verify key, confirm begin, then atomically replace only the selected buffer. R opens a read-only view. |
| Communications | 22–38 / 25–41 | Audio/acoustic or connector; direct digital. Select T/R. Acoustic TX includes U/E telephone profile. Digital TX selects speed after buffer; digital RX selects speed after clearing/storage choice. ENTER starts or arms. No automatic decryption, printing or protocol ACK. |
| Quiet mode, authentication | 39–42 / 42–45 | Silent disables clicks/alarms/acoustic coupling. Authentication uses spoken challenge and reply, the current key and RTC. |
| Zeroisation, view angle, RTC | 42–45 / 45–48 | ZRO single requires two digits, ENTER and Y. ZRO A requires Y and clears both buffers as well as all keys. Contrast adjustment uses arrows. Clock view preserves underlying state. |
| Printer, off | 45–47 / 48–50 | P chooses buffer then P/L/F. Plaintext needs explicit release to the printer. XIT stops printing. Off requires Y; retained keys require reselection. |
| Appendix A | 49 / 51 | Six-pin port shared by radio, digital or printer. Separate acoustic adaptor and main battery compartment. Pins and signals are identified in the scan. Hardware interfacing is outside the application. |
| Appendix B | 51–54 / 52–55 | Buffer-type warnings, invalid decrypt, empty/full memory, connection failure, denied locally entered cipher, lost sync, uncorrectable errors, plaintext send/print restrictions, quiet output denial, low battery and automatic key erasure on malfunction. |
| Appendix C | 55 / 56 | Print or review cipher, relay symbols, enter into receiving editor and decrypt. |
| Appendix D | 57 / 57 | Historical troubleshooting includes display contrast, cell condition, contacts and orientation. Bench controls implement logical power replacement and reset. Physical maintenance, warranty and disposal are outside the simulator. |
| Appendix E | 59–65 / 58–64 | Condensed operating sequences underpin the guide and end-to-end journeys. Detailed procedures supply confirmations omitted in the abbreviated lists. |
| Appendices F/G | 67–70 / 65–68 | Physical specifications below. Environmental qualification describes tests on hardware. |

## Physical reference

The manual lists width 6.65 in (168.9 mm), height 1.65 in (41.9 mm), depth 3.75 in (95.3 mm) and weight 2.04 lb (0.926 kg). Its keyboard has standard QWERTY plus fifteen special functions, with no shifted layer. The two-line, forty-column LCD and two 2600-character message spaces are represented in software.

Four AA cells power the unit. Appendix F lists alkaline 24 h, NiCad 6 h and lithium 75 h. Chapter 1 describes a non-replaceable 750 mAh lithium backup for RAM and the RTC. Appendix F gives maximum current of 90 µA off, 90 mA on and 190 mA transmitting. The simulator's four-minute low-power deadline follows the warning description. It has no analogue battery model.

Appendix F identifies RS-232 with stated RS-423 qualifications, asynchronous rates from 50 to 19200 bps, an acoustic or direct-connect Bell 103 modem, 300 baud simplex and a radio audio/PTT interface. Digital uses one start, eight data and two stop bits, no parity. The six-pin port has one logical attachment at a time. No electrical waveform is generated.

Appendix G cites MIL-STD-810C test conditions: operation −20 to +50 °C, storage −40 to +65 °C, altitude 15,000 ft, immersion to 36 inches for two hours and a 48-inch drop onto two-inch plywood backed by concrete. It describes loose-cargo vibration, 100% humidity with condensation, rain, salt fog, fungus and resistance to sand/dust. These are reported hardware specifications. Browser tests exercise software behaviour only.

## Implementation boundaries

src/kl/device.ts dispatches physical key commands into a typed mode and bounded LCD rows. src/kl/editor.ts manages insertion, display wrapping and provenance. src/kl/provider.ts isolates training transforms. src/kl/bench.ts owns the virtual event clock, serialized frames and seeded impairment. React owns focus, device presentation, optional audio and the manuals. Rendering consumes state without scheduling operations. Distinct device instances own all mutable buffers, slots, RTCs and paper. In-flight reception is bound to the receiver generation and the route at frame start. Cancelling or resetting a device prevents stale delivery. The session uses no backend or stored keys.
