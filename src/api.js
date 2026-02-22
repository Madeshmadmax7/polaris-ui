/**
 * LifeOS – API Client (Frontend Dashboard)
 */

const API_BASE = 'http://127.0.0.1:8000/api';

function getToken() {
    return localStorage.getItem('lifeos_token');
}

export function setToken(token) {
    localStorage.setItem('lifeos_token', token);
}

export function clearToken() {
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
}

export function getUser() {
    const data = localStorage.getItem('lifeos_user');
    return data ? JSON.parse(data) : null;
}

export function setUser(user) {
    localStorage.setItem('lifeos_user', JSON.stringify(user));
}

async function request(endpoint, options = {}) {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    // Handle FormData (file upload)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // For auth endpoints (login/register), let the actual error message through
        const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register';

        if (response.status === 401 && !isAuthEndpoint) {
            clearToken();
            window.location.href = '/login';
            throw new Error('Session expired');
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || 'Request failed');
        }

        return await response.json();
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err);
        throw err;
    }
}

// ── Auth ────────────────────────────────────────────────
export const auth = {
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
};

// ── Tracking ────────────────────────────────────────────
export const tracking = {
    getLogs: (params) => request(`/tracking/logs?${new URLSearchParams(params)}`),
    getDomains: (params) => request(`/tracking/domains?${new URLSearchParams(params)}`),
    setCategory: (data) => request('/tracking/categories', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Productivity ────────────────────────────────────────
export const productivity = {
    getToday: () => request('/productivity/today'),
    getTrend: (days = 7) => request(`/productivity/trend?days=${days}`),
};

// ── Parental ────────────────────────────────────────────
export const parental = {
    invite: (email) => request(`/parental/invite?child_email=${encodeURIComponent(email)}`, { method: 'POST' }),
    acceptInvite: (code) => request(`/parental/accept-invite?invite_code=${code}`, { method: 'POST' }),
    getChildren: () => request('/parental/children'),
    getChildOverview: (id) => request(`/parental/child/${id}`),
    blockSite: (data) => request('/parental/block', { method: 'POST', body: JSON.stringify(data) }),
    unblockSite: (id, childId) => request(`/parental/unblock/${id}?child_id=${childId}`, { method: 'POST' }),
    getBlockedSites: (id) => request(`/parental/blocked-sites/${id}`),
};

// ── WebSocket ───────────────────────────────────────
export function connectDashboardWS(token, onMessage) {
    const url = `ws://127.0.0.1:8000/ws?token=${encodeURIComponent(token)}`;
    let ws;
    let alive = true;

    function connect() {
        if (!alive) return;
        ws = new WebSocket(url);
        ws.onopen = () => console.log('[WS] Dashboard connected');
        ws.onmessage = (event) => {
            try { onMessage(JSON.parse(event.data)); } catch {}
        };
        ws.onclose = () => {
            if (alive) setTimeout(connect, 3000);
        };
        ws.onerror = () => {};
    }

    connect();

    return {
        close: () => { alive = false; if (ws) ws.close(); },
    };
}

// ── AI / Learning ───────────────────────────────────────
export const ai = {
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/ai/upload', { method: 'POST', body: formData });
    },
    getDocuments: () => request('/ai/documents'),
    createStudyPlan: (data) => request('/ai/study-plan', { method: 'POST', body: JSON.stringify(data) }),
    getStudyPlans: () => request('/ai/study-plans'),
    getStudyPlan: (id) => request(`/ai/study-plan/${id}`),
    getStudyPlanProgress: (planId) => request(`/ai/study-plan/${planId}/progress`),
    markChapterComplete: (planId, chapterNumber) => 
        request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/complete`, { method: 'POST' }),
    submitPlanQuiz: (planId, answers) => 
        request(`/ai/study-plan/${planId}/quiz/submit`, { method: 'POST', body: JSON.stringify(answers) }),
};
