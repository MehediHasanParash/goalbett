// Re-export auth utilities for backward compatibility
export { verifyToken, verifyJWT } from "./jwt.js"
export { getAuthToken, setAuthToken, removeAuthToken } from "./auth-service.js"
