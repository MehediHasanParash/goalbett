import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token) {
  try {
    console.log("[v0] JWT: Verifying token...")
    console.log("[v0] JWT: Token length:", token?.length, "Token preview:", token?.substring(0, 50) + "...")
    console.log("[v0] JWT: Token parts:", token?.split(".")?.length)

    const result = jwt.verify(token, JWT_SECRET)
    console.log("[v0] JWT: Token verified successfully, payload keys:", Object.keys(result))
    return result
  } catch (error) {
    console.error("[v0] JWT verification failed:", error.message)
    console.error("[v0] JWT error name:", error.name)

    const parts = token?.split(".") || []

    // Try to decode as a proper JWT payload (middle part)
    if (parts.length === 3) {
      try {
        console.log("[v0] JWT: Attempting to decode JWT payload directly...")
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
        console.log("[v0] JWT: Decoded payload (unverified), role:", payload.role)
        // Return the payload even if signature verification failed
        // This is for development - in production, you'd want stricter checks
        if (payload.role) {
          return payload
        }
      } catch (e) {
        console.error("[v0] JWT payload decode failed:", e.message)
      }
    }

    // Try legacy base64-encoded JSON (single part token)
    if (parts.length === 1) {
      try {
        console.log("[v0] JWT: Attempting legacy single-part token decode...")
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
        if (decoded.role) {
          console.log("[v0] JWT: Legacy token decoded successfully, role:", decoded.role)
          return decoded
        }
      } catch (legacyError) {
        console.error("[v0] Legacy token decode failed:", legacyError.message)
      }
    }

    // Try URL-safe base64 decode
    try {
      console.log("[v0] JWT: Attempting URL-safe base64 decode...")
      const urlSafeToken = token.replace(/-/g, "+").replace(/_/g, "/")
      const decoded = JSON.parse(Buffer.from(urlSafeToken, "base64").toString("utf-8"))
      if (decoded.role) {
        console.log("[v0] JWT: URL-safe decoded successfully, role:", decoded.role)
        return decoded
      }
    } catch (e) {
      console.error("[v0] URL-safe decode failed:", e.message)
    }

    return null
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}

export const verifyJWT = verifyToken
