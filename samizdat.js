const crypto = require("crypto");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function encrypt() {
  const zprava = await ask("Zpráva: ");
  const heslo = await ask("Heslo: ");

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(heslo, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(zprava, "utf8"),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  fs.writeFileSync(
    "zprava.enc",
    Buffer.concat([salt, iv, tag, encrypted])
  );

  console.log("Encryption successful.");
}

async function decrypt() {
  const heslo = await ask("Heslo: ");
  const data = fs.readFileSync("zprava.enc");

  const salt = data.subarray(0, 16);
  const iv = data.subarray(16, 28);
  const tag = data.subarray(28, 44);
  const encrypted = data.subarray(44);

  try {
    const key = crypto.scryptSync(heslo, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    decipher.setAuthTag(tag);

    const zprava = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    console.log("\n" + zprava.toString("utf8"));
  } catch {
    console.log("Nesprávné heslo.");
  }
}

async function main() {
  const mode = process.argv[2];

  if (mode === "encrypt") {
    await encrypt();
  } else if (mode === "decrypt") {
    await decrypt();
  } else {
    console.log("Use: node samizdat.js decrypt");
  }

  rl.close();
}

main();
