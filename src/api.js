/**
 * Polaris – API Client (Frontend Dashboard)
 */

// Use same-origin API base in dev; Vite proxy forwards /api to backend.
const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('polaris_token');
}

export function setToken(token) {
    localStorage.setItem('polaris_token', token);
}

export function clearToken() {
    localStorage.removeItem('polaris_token');
    localStorage.removeItem('polaris_user');
}

export function getUser() {
    const data = localStorage.getItem('polaris_user');
    return data ? JSON.parse(data) : null;
}

export function setUser(user) {
    localStorage.setItem('polaris_user', JSON.stringify(user));
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
            const message = typeof err.detail === 'string' ? err.detail : (err.detail?.message || 'Request failed');
            const e = new Error(message);
            e.status = response.status;
            e.rawDetail = err.detail;
            throw e;
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
    getStreak: () => request('/productivity/streak'),
    getWeeklyReport: () => request('/productivity/weekly-report'),
    getLearningVelocity: (days = 30) => request(`/productivity/learning-velocity?days=${days}`),
    getTopicHeatmap: () => request('/productivity/topic-heatmap'),
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
    
    // OTP-based connection system
    requestConnection: (childEmail) => request('/parental/request-connection', {
        method: 'POST',
        body: JSON.stringify({ child_email: childEmail })
    }),
    getConnectionRequest: (connectionId) => request(`/parental/connection-request/${connectionId}`),
    verifyConnection: (connectionId, otpCode) => request('/parental/verify-connection', {
        method: 'POST',
        body: JSON.stringify({ connection_id: connectionId, otp_code: otpCode })
    }),
    verifyConnectionByEmail: (childEmail, otpCode) => request('/parental/verify-connection-by-email', {
        method: 'POST',
        body: JSON.stringify({ child_email: childEmail, otp_code: otpCode })
    }),
    getChildToday: (childId) => request(`/parental/child/${childId}/today`),
    getChildTrend: (childId, days = 14) => request(`/parental/child/${childId}/trend?days=${days}`),
    getChildDashboardStats: (childId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/parental/child/${childId}/dashboard-stats${query ? '?' + query : ''}`);
    },
    getChildDashboard: (childId) => request(`/parental/child-dashboard/${childId}`),
    uploadChildDocument: async (childId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request(`/parental/child/${childId}/upload-document`, { method: 'POST', body: formData });
    },
    getChildDocuments: (childId) => request(`/parental/child/${childId}/documents`),
    createChildStudyPlan: (childId, data) => request(`/parental/child/${childId}/study-plan`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getChildStudyPlans: (childId) => request(`/parental/child/${childId}/study-plans`),
    getChildStudyPlanProgress: (childId, planId) => request(`/parental/child/${childId}/study-plan/${planId}/progress`),
    getChildStudyPlanQuizAttempts: (childId, planId) => request(`/parental/child/${childId}/study-plan/${planId}/quiz-attempts`),
    getMyConnections: () => request('/parental/my-connections'),
    getPendingRequests: () => request('/parental/pending-requests'),
    disconnect: (connectionId) => request(`/parental/disconnect/${connectionId}`, { method: 'POST' }),
    cancelPending: (connectionId) => request(`/parental/cancel-pending/${connectionId}`, { method: 'POST' }),
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
    getChapterSummary: (planId, chapterNumber) =>
        request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/summary`),
    submitPlanQuiz: (planId, answers) => 
        request(`/ai/study-plan/${planId}/quiz/submit`, { method: 'POST', body: JSON.stringify(answers) }),
    getQuizAttempts: (planId) =>
        request(`/ai/study-plan/${planId}/quiz-attempts`),
    // options = { override_duration_days, override_difficulty, weak_topics } (all optional)
    regenerateStudyPlan: (planId, options = null) =>
        request(`/ai/study-plan/${planId}/regenerate`, {
            method: 'POST',
            body: JSON.stringify(options || {}),
        }),
    // Agent: analyze latest quiz attempt and return recommendations (no auto-changes)
    analyzeQuizResult: (planId) =>
        request(`/ai/study-plan/${planId}/analyze-quiz`),
};

// ── Notifications ───────────────────────────────────────
export const notifications = {
    getAll: (limit = 20) => request(`/notifications?limit=${limit}`),
    markAsRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'POST' }),
    delete: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' }),
    clearAll: () => request('/notifications/clear-all', { method: 'POST' }),
};
