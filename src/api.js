/**
 * LifeOS – API Client (Frontend Dashboard)
 */

// Use localhost if accessed via localhost, otherwise use 127.0.0.1
const API_HOST = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
const API_BASE = `http://${API_HOST}:8000/api`;

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
    resetToday: () => request('/tracking/reset-today', { method: 'DELETE' }),
};

// ── Productivity ────────────────────────────────────────
export const productivity = {
    getToday: () => request('/productivity/today'),
    getTrend: (days = 7) => request(`/productivity/trend?days=${days}`),
    getDashboardStats: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/productivity/dashboard-stats${query ? '?' + query : ''}`);
    },
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
    const host = window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
    const url = `ws://${host}:8000/ws?token=${encodeURIComponent(token)}`;
    let ws;
    let alive = true;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000; // 30 seconds max
    const baseDelay = 3000; // 3 seconds base

    function getReconnectDelay() {
        // Exponential backoff: 3s, 6s, 12s, 24s, 30s (capped)
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), maxReconnectDelay);
        return delay;
    }

    function connect() {
        if (!alive) return;
        
        try {
            ws = new WebSocket(url);
            
            ws.onopen = () => {
                console.log('[WS] Dashboard connected');
                reconnectAttempts = 0; // Reset on successful connection
            };
            
            ws.onmessage = (event) => {
                try { 
                    onMessage(JSON.parse(event.data)); 
                } catch (err) {
                    console.error('[WS] Message parse error:', err);
                }
            };
            
            ws.onclose = (event) => {
                console.log(`[WS] Closed (code: ${event.code})`);
                if (alive) {
                    reconnectAttempts++;
                    const delay = getReconnectDelay();
                    console.log(`[WS] Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts})...`);
                    setTimeout(connect, delay);
                }
            };
            
            ws.onerror = (err) => {
                console.error('[WS] Connection error:', err);
            };
        } catch (err) {
            console.error('[WS] Failed to create WebSocket:', err);
            if (alive) {
                reconnectAttempts++;
                setTimeout(connect, getReconnectDelay());
            }
        }
    }

    connect();

    return {
        close: () => { 
            alive = false; 
            if (ws) {
                ws.close();
                ws = null;
            }
        },
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
    updateChapterProgress: (planId, chapterNumber, watchedSeconds) =>
        request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/update-progress`, {
            method: 'POST',
            body: JSON.stringify({ watched_seconds: watchedSeconds })
        }),
    setChapterVideo: (planId, chapterNumber, videoUrl, videoDuration, creatorName) =>
        request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/set-video`, {
            method: 'POST',
            body: JSON.stringify({ 
                video_url: videoUrl, 
                video_duration_seconds: videoDuration,
                creator_name: creatorName 
            })
        }),
    setPendingChapter: (planId, chapterIndex) =>
        request('/ai/set-pending-chapter', {
            method: 'POST',
            body: JSON.stringify({ plan_id: planId, chapter_index: chapterIndex })
        }),
    resetChapter: (planId, chapterNumber) =>
        request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/reset`, { method: 'POST' }),
    submitPlanQuiz: (planId, answers) => 
        request(`/ai/study-plan/${planId}/quiz/submit`, { method: 'POST', body: JSON.stringify(answers) }),
    getQuizAttempts: (planId) =>
        request(`/ai/study-plan/${planId}/quiz-attempts`),
};
