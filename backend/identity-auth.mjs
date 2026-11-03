import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
export function createIdentityAuth({ db, q, run, dataDir, fail }) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS login_identities(user_id TEXT UNIQUE REFERENCES users(id),kind TEXT NOT NULL,country TEXT NOT NULL,lookup_hash TEXT UNIQUE NOT NULL);`,
  );
  const keyPath = path.join(dataDir, "identity-lookup.key");
  if (!existsSync(keyPath))
    writeFileSync(keyPath, randomBytes(32), { flag: "wx", mode: 0o600 });
  const key = readFileSync(keyPath);
  function prepare(b) {
    const kind = b.login_method || "username";
    if (kind === "username") return null;
    if (!["resident", "tourist"].includes(kind))
      fail(400, "Choose username, resident or tourist login.");
    const number = String(b.identity_number || "")
      .replace(/[ -]/g, "")
      .toUpperCase();
    const country =
      kind === "resident"
        ? "AE"
        : String(b.issuing_country || "")
            .trim()
            .toUpperCase();
    if (kind === "resident" && !/^784\d{12}$/.test(number))
      fail(
        400,
        "Enter a 15-digit Emirates ID beginning with 784. Format only; identity is not verified.",
      );
    if (
      kind === "tourist" &&
      (!/^[A-Z0-9]{5,20}$/.test(number) || !/^[A-Z]{2}$/.test(country))
    )
      fail(
        400,
        "Enter a passport number (5–20 letters/numbers) and two-letter issuing country code.",
      );
    return {
      kind,
      country,
      number,
      hash: createHmac("sha256", key)
        .update(JSON.stringify([kind, country, number]))
        .digest("hex"),
    };
  }
  return {
    prepare,
    lookup: (b) => {
      const identity = prepare(b);
      return identity
        ? q(
            "SELECT users.* FROM login_identities JOIN users ON users.id=login_identities.user_id WHERE lookup_hash=?",
            identity.hash,
          )
        : null;
    },
    attach: (userId, identity) => {
      if (identity)
        run(
          "INSERT INTO login_identities(user_id,kind,country,lookup_hash) VALUES(?,?,?,?)",
          userId,
          identity.kind,
          identity.country,
          identity.hash,
        );
    },
    exists: (identity) =>
      identity &&
      q(
        "SELECT user_id FROM login_identities WHERE lookup_hash=?",
        identity.hash,
      ),
  };
}
