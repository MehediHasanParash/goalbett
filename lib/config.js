// Environment configuration
const ENV = process.env.NODE_ENV || "development"

const config = {
  development: {
    name: "development",
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    mongoUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL || process.env.KV_URL,
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    enableDebugLogs: true,
  },
  staging: {
    name: "staging",
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    mongoUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL || process.env.KV_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    enableDebugLogs: true,
  },
  production: {
    name: "production",
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    mongoUri: process.env.MONGODB_URI,
    redisUrl: process.env.REDIS_URL || process.env.KV_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    enableDebugLogs: false,
  },
}

export default config[ENV]
