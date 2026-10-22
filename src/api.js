const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map(item => item.msg).join(' ')
      : data.detail;
    const error = new Error(detail || 'The request failed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function health() {
  return request('/api/health');
}

export async function getCurrentUser() {
  try {
    const data = await request('/api/auth/me');
    return data.user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function signUp(payload) {
  const data = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.user;
}

export async function signIn(payload) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data.user;
}

export async function signOut() {
  return request('/api/auth/logout', { method: 'POST' });
}

export async function createTask(payload) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
