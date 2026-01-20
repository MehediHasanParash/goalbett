export function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem("authToken")
}

export function setAuthToken(token) {
  if (typeof window === "undefined") {
    return
  }
  localStorage.setItem("authToken", token)
}

export function removeAuthToken() {
  if (typeof window === "undefined") {
    return
  }
  localStorage.removeItem("authToken")
}

export function isAuthenticated() {
  return !!getAuthToken()
}
