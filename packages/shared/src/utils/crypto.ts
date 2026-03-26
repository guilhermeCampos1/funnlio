import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!key) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY não definida — impossível criptografar credenciais')
  }
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== 32) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)')
  }
  return buf
}

/**
 * Encrypts a JSON-serializable object using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
export function encryptCredentials(data: Record<string, unknown>): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const plaintext = JSON.stringify(data)
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a string produced by encryptCredentials back to an object.
 */
export function decryptCredentials(encryptedString: string): Record<string, string> {
  const key = getEncryptionKey()
  const parts = encryptedString.split(':')

  if (parts.length !== 3) {
    throw new Error('Formato de credenciais criptografadas inválido')
  }

  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted) as Record<string, string>
}
