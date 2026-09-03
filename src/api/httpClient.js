const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getToken = () => {
  try {
    const raw = window.localStorage.getItem("authUser");
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
};

// Thin wrapper around fetch shared by every api/* module: builds the full
// URL, attaches the JWT when `auth: true`, and normalizes error responses
// into a thrown Error with the server's message.
export const apiRequest = async (
  path,
  { method = "GET", body, signal, auth = false } = {},
) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
};
