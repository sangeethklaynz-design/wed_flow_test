const ACCESS_TOKEN_KEY = "wedflow_access_token";
const REFRESH_TOKEN_KEY = "wedflow_refresh_token";
const USER_KEY = "wedflow_user";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession({ accessToken, refreshToken, user } = {}) {
  if (typeof window === "undefined") return;
  if (accessToken)
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken)
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function logout() {
  clearAuthSession();
}
