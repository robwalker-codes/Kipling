# Historical evidence

The machine-readable register is src/evidence.json. It distinguishes contemporary records, stock and artefact inventories, personal recollections, simulator design choices and unresolved questions.

The research baseline was supplied on 19 November 2026. Requests to the source sites and a targeted search for BIDC/1490, CES46953 and 5810-99-591-2923 did not yield independently accessible documentation in this environment. No source passage, original faceplate photograph or firmware image was independently verified.

## H01 · Identity

Documented · S1

KIPLING is identified by the MoD as BIDC/1490. Historical context.

## H02 · Purpose

Documented · S2

Project KIPLING provided security for tactical data transmissions using CLANSMAN. The NAO records a project cost of £14 million among interim measures associated with BOWMAN delays. Historical context.

## H03 · Portable kit

Catalogue/artefact · S3

NSN 5810-99-591-2923; catalogue description identifies a portable KIPLING kit. Identifies kit or accessory only.

## H04 · Equipment references

Catalogue/artefact · S3

CES46953 and CESP/46953 appear in the kit record. Identifies kit or accessory only.

## H05 · Date

Catalogue/artefact · S3

The catalogue assignment date is 7 November 1994. This is not proof of an exact introduction-to-service date. Identifies kit or accessory only.

## H06 · Operator workflow

Reported · S4

Former users recall typing messages, passing them securely over Clansman and printing received messages on narrow roll paper. Informs exercise narrative only.

## H07 · Day/date behaviour

Reported · S4

Former users recall failures between stations when day/date updating or synchronisation was incorrect. The actual mechanism is not established. Informs exercise narrative only.

## H08 · Operational context

Reported · S4

Contributors recall use in 1996–97, 1998–2000 and Telic 1, including demands for stores. Informs exercise narrative only.

## H09 · Training context

Documented · S5

The Royal Signals journal records training on the KIPLING data-entry device in an April 1999 exercise account. Contemporary unit training account. Provides exercise context only.

## H10 · Radio cable

Catalogue/artefact · S6

A supplier describes a seven-pin KIPLING-to-radio cable, NSN 5995-99-662-6364. Pin assignments are not established. Identifies kit or accessory only.

## H11 · Power cable

Catalogue/artefact · S7

A supplier describes a KIPLING DED J4 DC cable, product code 5171351, with two-pin male and small three-pin female ends. Voltage is not established. Identifies kit or accessory only.

## H12 · Carrying bag

Catalogue/artefact · S8

A KIPLING DPM IRR carrying bag is listed under NSN 8465-99-300-6325. This number belongs to the bag, not the terminal. Identifies kit or accessory only.

## H13 · Obsolescence

Documented · S1

The March 2013 DIN digest lists notice 2013DIN04-027 declaring BIDC/1490 obsolete. This does not establish continuous operational use until 2013. Historical context.

## R01 · Physical design

Reconstruction · Profile v1

Enclosure, keyboard, LCD and paper rendering are interpretive. Configures the simulator.

## R02 · Message handling

Reconstruction · Profile v1

Character set, lengths, stores, routing, identities, duplicate handling and ACK policy are product choices. Configures the simulator.

## R03 · Radio medium

Reconstruction · Profile v1

Logical channels, airtime, collisions, frame loss, timing and diagnostics are simulated. Configures the simulator.

## R04 · Date and cryptography

Reconstruction · Profile v1

Manual key epochs and Web Crypto AES-GCM with HKDF are modern substitutes. Configures the simulator.

## R05 · State and printing

Reconstruction · Profile v1

Power retention, roll capacity, wrapping, spool speed, archive and persistence are designed behaviours. Configures the simulator.

## U01 · Unestablished details

Unknown · Supplied baseline

manufacturer, precise enclosure and keyboard layout, display dimensions, exact screen text, processor, firmware, message and memory limits, baud rate, modulation, wire protocol, acknowledgement/retry rules, printer model and paper width, power consumption, battery endurance, cipher and key-management procedures, and the complete list of supported radio sets. No original specification inferred.

## Source locators

- S1 · MoD DIN Digest, March 2013. PDF page 6, entry 2013DIN04-027. https://assets.publishing.service.gov.uk/media/5a7cde8ded915d7c849adbc7/DINDIGEST_2013_March.pdf
- S2 · National Audit Office, Major Projects Report 1999. Paragraph 3.25, printed page 47. https://www.nao.org.uk/wp-content/uploads/2000/07/9900613full.pdf https://www.nao.org.uk/reports/ministry-of-defence-major-projects-report-1999/
- S3 · Reproduced kit stock record. Kit stock record 5810-99-591-2923. https://www.nsndepot.com/NSN/5810-99-591-2923
- S4 · ARRSE, “Anyone remember KIPLING?”, 16 August 2013. particularly posts 4, 7, 8, 10 and 11. The thread contains conflicting recollections and possible confusion with other equipment. https://www.arrse.co.uk/community/threads/anyone-remember-kipling.202851/
- S5 · The Wire, April 1999, Exercise Winter Link account. printed pages 166–167 in the annual scan. This is a large PDF; avoid downloading the whole collection unnecessarily. https://www.royalsignalsmuseum.co.uk/wp-content/wire/Wire1999.pdf
- S6 · Supplier radio-cable inventory. search within this page for KIPLING or 6626364. https://www.lrseries.com/index.php?page=145&route=product%2Fsearch&search=clansman+antenna
- S7 · Supplier power-cable inventory. search for KIPLING or 5171351. https://www.lrseries.com/index.php?limit=50&page=13&route=product%2Fsearch&search=assy&sort=az
- S8 · Supplier accessories inventory. Accessories inventory, bag NSN 8465-99-300-6325. https://www.lrseries.com/index.php?path=4750&route=product%2Fcategory
- S9 · Related equipment only. Racal MA4450 Version 1 TDED Operator’s Handbook, TH8426, April 1987. It is useful context but has not been established as KIPLING. https://doczz.net/doc/8138439/tactical-data-entry-device–tded–ma-4450

The highest-value addition would be an identifiable BIDC/1490 operator handbook or CES46953 illustrated equipment schedule. A provenance-checked photograph of the display, keyboard and printer together would help resolve the physical layout.
