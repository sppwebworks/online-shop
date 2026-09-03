const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getToken = () => {
  try {
    const raw = window.localStorage.getItem("authUser");
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
};

// Separate from httpClient's apiRequest because a file upload is
// multipart/form-data, not JSON — the browser must set its own
// Content-Type (with the multipart boundary), so we can't set it manually.
export const uploadApi = {
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Upload failed (${response.status})`);
    }

    return data;
  },
};
