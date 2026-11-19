# Simulation protocol v1

This protocol exists entirely within one browser page. It uses modern Web Crypto for a behavioural reconstruction. Original wire compatibility, historical cryptography and electrical interfacing are outside its scope.

Each frame has a header tuple in fixed order: version (integer 1), frame type (DATA or ACK), source callsign, destination callsign or *, logical message ID, attempt ID and net ID. Encode the tuple with JavaScript JSON.stringify, no optional fields or whitespace, then UTF-8. These bytes are AES-GCM additional authenticated data. Logical channels are medium properties. Physical channel eligibility and logical net key derivation are checked separately.

Each station holds its own 32-byte exercise root. The session creates synthetic shared key material using crypto.getRandomValues. A station can load the issued shared key, generate an independent different key or clear its reference. No endpoint copies another endpoint's key during reception.

The AES-256 key comes from HKDF-SHA-256 with the root as input key material, literal UTF-8 salt KIPLING-SIM-v1 and UTF-8 JSON array ["traffic",net,epoch] as info. The epoch is the station's active ISO UTC date. A receiver uses its own net and epoch. Each encryption generates a fresh platform-random 12-byte IV and uses a 128-bit GCM tag. Web Crypto supplies the ciphertext with tag appended. The in-memory envelope carries header, nonce bytes and ciphertext bytes. Encrypted DATA contains a UTF-8 JSON tuple of normalized body and numeric sender-local milliseconds since the Unix epoch. ACK encrypts the literal UTF-8 text ACCEPTED.

After successful decryption, an endpoint checks destination. It stores new DATA if a slot is available and optionally queues a receipt. The receive store recognises duplicates by authenticated source and logical ID. Deleting the receipt ends that duplicate recognition. A recognised duplicate is ACKed even in a full store. Broadcast DATA has no ACK. ACKs travel in a distinct on-air interval. Confirmation requires a pending attempt, correct peer, destination, logical ID, attempt ID, authenticated payload and arrival before timeout. An acknowledged snapshot has no retry action. A new SEND takes a new logical snapshot.

Frame loss and corruption are simulated. Corruption changes one ciphertext byte after sealing. Diagnostics record carrier, event IDs, rejection and timeout without message bodies or keys. The single-page instructor owns both endpoints. The simulation provides no security boundary against the operator of that browser.
