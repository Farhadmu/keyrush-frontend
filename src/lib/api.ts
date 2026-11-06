const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  roles: string[];
  country: string;
  accessToken: string;
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('keyrush_token');
};

export const getCurrentUser = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('keyrush_user');
  return user ? JSON.parse(user) : null;
};

export const setAuthSession = (user: any, token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('keyrush_token', token);
  localStorage.setItem('keyrush_user', JSON.stringify({ ...user, accessToken: token }));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('keyrush_token');
  localStorage.removeItem('keyrush_user');
};

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  // Auth
  register: (payload: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => apiFetch('/auth/me'),

  // Typing
  getRandomPassage: (language: string = 'EN', difficulty?: string) =>
    apiFetch(`/typing/passages/random?language=${language}${difficulty ? `&difficulty=${difficulty}` : ''}`),

  // Racing
  getCars: () => apiFetch('/racing/cars'),
  getBots: (count: number = 3, targetWpm: number = 65) =>
    apiFetch(`/racing/bots?count=${count}&targetWpm=${targetWpm}`),

  // Multiplayer
  getPublicRooms: () => apiFetch('/multiplayer/rooms'),
  getRoom: (id: string) => apiFetch(`/multiplayer/rooms/${id}`),
  createRoom: (payload: any) => apiFetch('/multiplayer/rooms', { method: 'POST', body: JSON.stringify(payload) }),

  // Competitions
  getCompetitions: () => apiFetch('/competitions'),
  getCompetition: (id: string) => apiFetch(`/competitions/${id}`),
  registerCompetition: (id: string) => apiFetch(`/competitions/${id}/register`, { method: 'POST' }),
  getHeats: (id: string) => apiFetch(`/events/${id}/heats`),

  // Organizations
  getOrganizations: () => apiFetch('/organizations'),

  // Leaderboard
  getGlobalLeaderboard: (limit: number = 20) => apiFetch(`/leaderboards/global?limit=${limit}`),
};
