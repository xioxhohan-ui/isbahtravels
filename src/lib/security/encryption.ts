import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_SECRET_KEY;
  if (!key || key === "isbah_travels_super_secret_32_byte_key_1234567890") {
    console.warn("⚠️ ENCRYPTION_SECRET_KEY is not set or is using default! Set a secure 32+ char key in production.");
  }
  return crypto.createHash("sha256").update(key || "change-me-in-production").digest();
}

/**
 * Encrypts a sensitive string (e.g. Passport number, National ID) using AES-256-GCM.
 */
export function encryptAES256GCM(text: string): { encryptedData: string; iv: string; authTag: string } {
  if (!text) return { encryptedData: "", iv: "", authTag: "" };

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decryptAES256GCM(encryptedData: string, iv: string, authTag: string): string {
  if (!encryptedData || !iv || !authTag) return "";

  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("AES-256-GCM Decryption Error:", err);
    return "[Encrypted Field]";
  }
}
