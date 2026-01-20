// Centralized version configuration
// Update this file when pushing new releases

export const APP_VERSION = {
  major: 1,
  minor: 3,
  patch: 0,
  build: "2025.12.26",
  releaseDate: "Dec 2025",
  environment: process.env.NODE_ENV || "development",
}

export function getVersionString() {
  return `v${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.patch}`
}

export function getFullVersionString() {
  return `${getVersionString()} - Build: ${APP_VERSION.releaseDate}`
}

export function getVersionInfo() {
  return {
    version: getVersionString(),
    fullVersion: getFullVersionString(),
    build: APP_VERSION.build,
    releaseDate: APP_VERSION.releaseDate,
    environment: APP_VERSION.environment,
  }
}
