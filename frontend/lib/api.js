const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
  } = options;

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const error = new Error(
      data?.message || data?.error || `Request failed (${res.status})`
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
