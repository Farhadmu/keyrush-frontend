const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  roles: string[];
  country: string;
  accessToken: string;
  isEmailVerified?: boolean;
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
  refresh: (refreshToken?: string) => apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  logoutAll: () => apiFetch('/auth/logout-all', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  getSessions: () => apiFetch('/auth/sessions'),
  revokeSession: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' }),
  verifyEmail: (token: string) => apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () => apiFetch('/auth/resend-verification', { method: 'POST' }),
  forgotPassword: (email: string) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  setup2Fa: () => apiFetch('/auth/2fa/setup', { method: 'POST' }),
  enable2Fa: (code: string) => apiFetch('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2Fa: (password: string) => apiFetch('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),

  // User & Profile
  getProfile: (username: string) => apiFetch(`/users/profile/${username}`),
  getMyDashboard: () => apiFetch('/users/me/dashboard'),
  updateProfile: (payload: any) => apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  updateCar: (carId: string) => apiFetch('/users/car', { method: 'PATCH', body: JSON.stringify({ carId }) }),

  // Admin
  getAdminUsers: (params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.role) qs.append('role', params.role);
    if (params.status) qs.append('status', params.status);
    if (params.page) qs.append('page', String(params.page));
    if (params.limit) qs.append('limit', String(params.limit));
    return apiFetch(`/users/admin/all?${qs.toString()}`);
  },
  updateUserStatus: (id: string, status: string) =>
    apiFetch(`/users/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateUserRoles: (id: string, roles: string[]) =>
    apiFetch(`/users/admin/${id}/roles`, { method: 'PATCH', body: JSON.stringify({ roles }) }),

  // Typing & Practice
  getRandomPassage: (language: string = 'EN', difficulty?: string, wordCount?: number) =>
    apiFetch(`/typing/passages/random?language=${language}${difficulty ? `&difficulty=${difficulty}` : ''}${wordCount ? `&wordCount=${wordCount}` : ''}`),
  getAllPassages: (language?: string) =>
    apiFetch(`/typing/passages${language ? `?language=${language}` : ''}`),
  recordPractice: (payload: any) =>
    apiFetch('/typing/practice/record', { method: 'POST', body: JSON.stringify(payload) }),
  getPracticeHistory: (limit: number = 20) =>
    apiFetch(`/typing/practice/history?limit=${limit}`),
  getUserWeaknesses: () =>
    apiFetch('/typing/practice/weaknesses'),

  // Racing & Results
  getCars: () => apiFetch('/racing/cars'),
  getCar: (id: string) => apiFetch(`/racing/cars/${id}`),
  getMyGarage: () => apiFetch('/racing/my-garage'),
  getCustomization: (carId: string) => apiFetch(`/racing/customization/${carId}`),
  saveCustomization: (carId: string, options: any) =>
    apiFetch(`/racing/customization/${carId}`, { method: 'POST', body: JSON.stringify(options) }),
  getRecentResults: (limit: number = 20) => apiFetch(`/racing/results/recent?limit=${limit}`),
  getResultById: (id: string) => apiFetch(`/racing/results/${id}`),
  getUserRaceHistory: (limit: number = 20) => apiFetch(`/racing/history?limit=${limit}`),

  // Multiplayer
  getPublicRooms: () => apiFetch('/multiplayer/rooms'),
  getRoom: (id: string) => apiFetch(`/multiplayer/rooms/${id}`),
  createRoom: (payload: any) => apiFetch('/multiplayer/rooms', { method: 'POST', body: JSON.stringify(payload) }),

  // Competitions & Tournaments
  getCompetitions: (orgId?: string) => apiFetch(`/competitions${orgId ? `?organizationId=${orgId}` : ''}`),
  getCompetition: (idOrSlug: string) => apiFetch(`/competitions/${idOrSlug}`),
  createCompetition: (payload: any) => apiFetch('/competitions', { method: 'POST', body: JSON.stringify(payload) }),
  registerCompetition: (id: string) => apiFetch(`/competitions/${id}/register`, { method: 'POST' }),
  getCompetitionRegistrations: (id: string) => apiFetch(`/competitions/${id}/registrations`),
  getHeats: (compId: string, round?: number) =>
    apiFetch(`/events/${compId}/heats${round ? `?round=${round}` : ''}`),
  generateHeats: (compId: string) =>
    apiFetch(`/events/${compId}/generate-heats`, { method: 'POST' }),
  getBracket: (id: string) => apiFetch(`/competitions/${id}/bracket`),
  generateBracket: (id: string) => apiFetch(`/competitions/${id}/bracket/generate`, { method: 'POST' }),
  updateMatchScore: (matchId: string, payload: any) =>
    apiFetch(`/competitions/matches/${matchId}/score`, { method: 'PATCH', body: JSON.stringify(payload) }),
  verifyCertificate: (certId: string) => apiFetch(`/competitions/certificate/verify/${certId}`),
  getMyCertificates: () => apiFetch('/competitions/certificates/my'),
  issueCertificates: (id: string) => apiFetch(`/competitions/${id}/certificates/issue`, { method: 'POST' }),

  // Organizations & Teams
  getOrganizations: () => apiFetch('/organizations'),
  getOrganization: (slug: string) => apiFetch(`/organizations/${slug}`),
  createOrganization: (payload: any) => apiFetch('/organizations', { method: 'POST', body: JSON.stringify(payload) }),
  getOrgMembers: (slug: string) => apiFetch(`/organizations/${slug}/members`),
  getOrgTeams: (slug: string) => apiFetch(`/organizations/${slug}/teams`),
  getOrgAnalytics: (slug: string) => apiFetch(`/organizations/${slug}/analytics`),
  requestJoinOrg: (id: string) => apiFetch(`/organizations/${id}/join`, { method: 'POST' }),
  approveOrgMember: (orgId: string, memberId: string) =>
    apiFetch(`/organizations/${orgId}/members/${memberId}/approve`, { method: 'PATCH' }),
  removeOrgMember: (orgId: string, memberId: string) =>
    apiFetch(`/organizations/${orgId}/members/${memberId}`, { method: 'DELETE' }),
  createOrgTeam: (orgId: string, payload: any) =>
    apiFetch(`/organizations/${orgId}/teams`, { method: 'POST', body: JSON.stringify(payload) }),
  addTeamMember: (teamId: string, userId: string) =>
    apiFetch(`/organizations/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),

  // Leaderboard
  getGlobalLeaderboard: (limit: number = 20) => apiFetch(`/leaderboards/global?limit=${limit}`),
  getRankedLeaderboard: (limit: number = 20) => apiFetch(`/leaderboards/ranked?limit=${limit}`),
  getCountryLeaderboard: (country: string = 'BD', limit: number = 50) =>
    apiFetch(`/leaderboards/country?country=${country}&limit=${limit}`),

  // AI & Intelligent Features
  getAiCoaching: (history: any[]) => apiFetch('/ai/coaching', { method: 'POST', body: JSON.stringify({ history }) }),
  getAiWeaknesses: (keyMissMap: Record<string, number>) =>
    apiFetch('/ai/weaknesses', { method: 'POST', body: JSON.stringify({ keyMissMap }) }),
  getAiPracticePlan: (level: number = 1, avgWpm: number = 50) =>
    apiFetch(`/ai/practice-plan?level=${level}&avgWpm=${avgWpm}`),
  generateAiPassage: (payload: { language?: string; difficulty?: string; topic?: string }) =>
    apiFetch('/ai/generate-passage', { method: 'POST', body: JSON.stringify(payload) }),

  // Economy & Battle Pass
  getBattlePass: () => apiFetch('/economy/battle-pass'),
  claimBattlePassTier: (tierLevel: number) =>
    apiFetch('/economy/battle-pass/claim', { method: 'POST', body: JSON.stringify({ tierLevel }) }),
  upgradeBattlePassSandbox: (provider: string = 'STRIPE_SANDBOX') =>
    apiFetch('/economy/sandbox-upgrade', { method: 'POST', body: JSON.stringify({ provider }) }),

  // System & Oversight
  getHealth: () => apiFetch('/health'),
  getAuditLogs: (limit: number = 50, skip: number = 0) =>
    apiFetch(`/audit/logs?limit=${limit}&skip=${skip}`),
  verifyOrganization: (id: string, isVerified: boolean, reason?: string) =>
    apiFetch(`/organizations/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ isVerified, reason }) }),
  updateOrganizationStatus: (id: string, isSuspended: boolean, reason?: string) =>
    apiFetch(`/organizations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isSuspended, reason }) }),
};
