const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`
          }
        : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed.");
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getAuthConfig() {
  return request("/auth/config");
}

export function getActivePolicy() {
  return request("/policies/active");
}

export function getCurrentSession(token) {
  return request("/auth/session", {
    token
  });
}

export function registerManualAccount(payload) {
  return request("/auth/register", {
    method: "POST",
    body: payload
  });
}

export function loginManualAccount(payload) {
  return request("/auth/login", {
    method: "POST",
    body: payload
  });
}

export function createGuestSession() {
  return request("/auth/guest", {
    method: "POST"
  });
}

export function acceptPolicies(token) {
  return request("/policies/accept", {
    method: "POST",
    token
  });
}

export function logout(token) {
  return request("/auth/logout", {
    method: "POST",
    token
  });
}

export function getMyStories(token) {
  return request("/dashboard/my-stories", {
    token
  });
}

export function getStories(token) {
  return request("/stories", {
    token
  });
}

export function getStory(storyId, token) {
  return request(`/stories/${storyId}`, {
    token
  });
}

export function runStoryPrivacyCheck(body, token) {
  return request("/stories/privacy-check", {
    method: "POST",
    token,
    body: {
      body
    }
  });
}

export function createStory(body, token) {
  return request("/stories", {
    method: "POST",
    token,
    body: {
      body
    }
  });
}

export function updateStory(storyId, body, token) {
  return request(`/stories/${storyId}`, {
    method: "PATCH",
    token,
    body: {
      body
    }
  });
}

export function deleteStory(storyId, token) {
  return request(`/stories/${storyId}`, {
    method: "DELETE",
    token
  });
}

export function sendStoryHug(storyId, token) {
  return request(`/stories/${storyId}/hugs`, {
    method: "POST",
    token
  });
}
