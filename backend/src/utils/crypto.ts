import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.CREDENCIALES_MASTER_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "CREDENCIALES_MASTER_KEY no está configurada o es inválida (debe ser un hex de 64 caracteres / 32 bytes)"
    );
  }
  return Buffer.from(keyHex, "hex");
}

export interface CredencialCifrada {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): CredencialCifrada {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(ciphertext: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
