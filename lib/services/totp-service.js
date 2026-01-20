// TOTP (Time-based One-Time Password) Service for MFA
// Uses HMAC-SHA1 algorithm compatible with Google Authenticator

import crypto from "crypto"

const TOTP_STEP = 30 // Time step in seconds
const TOTP_DIGITS = 6 // Number of digits in OTP

export class TOTPService {
  // Generate a random base32 secret
  static generateSecret(length = 20) {
    const buffer = crypto.randomBytes(length)
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""

    for (let i = 0; i < buffer.length; i++) {
      secret += base32Chars[buffer[i] % 32]
    }

    return secret
  }

  // Decode base32 to buffer
  static base32Decode(encoded) {
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    const cleanedInput = encoded.replace(/[=\s]/g, "").toUpperCase()

    let bits = ""
    for (const char of cleanedInput) {
      const val = base32Chars.indexOf(char)
      if (val === -1) continue
      bits += val.toString(2).padStart(5, "0")
    }

    const bytes = []
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(Number.parseInt(bits.substr(i, 8), 2))
    }

    return Buffer.from(bytes)
  }

  // Generate TOTP code for a given time
  static generateTOTP(secret, time = Date.now()) {
    let counter = Math.floor(time / 1000 / TOTP_STEP)
    const counterBuffer = Buffer.alloc(8)

    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = counter & 0xff
      counter >>= 8
    }

    const key = this.base32Decode(secret)
    const hmac = crypto.createHmac("sha1", key)
    hmac.update(counterBuffer)
    const hash = hmac.digest()

    const offset = hash[hash.length - 1] & 0x0f
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)

    const otp = binary % Math.pow(10, TOTP_DIGITS)
    return otp.toString().padStart(TOTP_DIGITS, "0")
  }

  // Verify TOTP code with time window tolerance
  static verifyTOTP(secret, code, window = 2) {
    const now = Date.now()
    // Ensure code is a string and padded to 6 digits
    const codeStr = String(code).padStart(TOTP_DIGITS, "0")

    console.log("[v0] TOTP Verify - Input code:", codeStr)
    console.log("[v0] TOTP Verify - Secret:", secret)
    console.log("[v0] TOTP Verify - Current time:", new Date(now).toISOString())

    for (let i = -window; i <= window; i++) {
      const time = now + i * TOTP_STEP * 1000
      const expectedCode = this.generateTOTP(secret, time)
      console.log(
        `[v0] TOTP Verify - Window ${i}: expected=${expectedCode}, got=${codeStr}, match=${codeStr === expectedCode}`,
      )

      if (codeStr === expectedCode) {
        console.log("[v0] TOTP Verify - SUCCESS at window", i)
        return true
      }
    }

    console.log("[v0] TOTP Verify - FAILED, no matching code found")
    return false
  }

  // Generate QR code URL for authenticator apps
  static generateQRCodeURL(secret, email, issuer = "GoalBett") {
    const encodedIssuer = encodeURIComponent(issuer)
    const encodedEmail = encodeURIComponent(email)
    const otpAuthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP}`

    // Return Google Charts QR code URL
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpAuthUrl)}`
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = []
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
  }
}

export default TOTPService
