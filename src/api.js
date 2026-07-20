/**
 * Polaris – API Client (Frontend Dashboard)
 */

// Use local backend if accessing from localhost/127.0.0.1, otherwise use deployed Render backend
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : 'https://polaris-api-wf4d.onrender.com/api';

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

// [V2+] Parental API — uncomment when parental controls are enabled
// export const parental = {
//     invite: (email) => request(`/parental/invite?child_email=${encodeURIComponent(email)}`, { method: 'POST' }),
//     acceptInvite: (code) => request(`/parental/accept-invite?invite_code=${code}`, { method: 'POST' }),
//     getChildren: () => request('/parental/children'),
//     getChildOverview: (id) => request(`/parental/child/${id}`),
//     blockSite: (data) => request('/parental/block', { method: 'POST', body: JSON.stringify(data) }),
//     unblockSite: (id, childId) => request(`/parental/unblock/${id}?child_id=${childId}`, { method: 'POST' }),
//     getBlockedSites: (id) => request(`/parental/blocked-sites/${id}`),
//     requestConnection: (childEmail) => request('/parental/request-connection', {
//         method: 'POST',
//         body: JSON.stringify({ child_email: childEmail })
//     }),
//     getConnectionRequest: (connectionId) => request(`/parental/connection-request/${connectionId}`),
//     verifyConnection: (connectionId, otpCode) => request('/parental/verify-connection', {
//         method: 'POST',
//         body: JSON.stringify({ connection_id: connectionId, otp_code: otpCode })
//     }),
//     verifyConnectionByEmail: (childEmail, otpCode) => request('/parental/verify-connection-by-email', {
//         method: 'POST',
//         body: JSON.stringify({ child_email: childEmail, otp_code: otpCode })
//     }),
//     getChildToday: (childId) => request(`/parental/child/${childId}/today`),
//     getChildTrend: (childId, days = 14) => request(`/parental/child/${childId}/trend?days=${days}`),
//     getChildDashboardStats: (childId, params = {}) => {
//         const query = new URLSearchParams(params).toString();
//         return request(`/parental/child/${childId}/dashboard-stats${query ? '?' + query : ''}`);
//     },
//     getChildDashboard: (childId) => request(`/parental/child-dashboard/${childId}`),
//     uploadChildDocument: async (childId, file) => {
//         const formData = new FormData();
//         formData.append('file', file);
//         return request(`/parental/child/${childId}/upload-document`, { method: 'POST', body: formData });
//     },
//     getChildDocuments: (childId) => request(`/parental/child/${childId}/documents`),
//     createChildStudyPlan: (childId, data) => request(`/parental/child/${childId}/study-plan`, {
//         method: 'POST',
//         body: JSON.stringify(data)
//     }),
//     getChildStudyPlans: (childId) => request(`/parental/child/${childId}/study-plans`),
//     getChildStudyPlanProgress: (childId, planId) => request(`/parental/child/${childId}/study-plan/${planId}/progress`),
//     getChildStudyPlanQuizAttempts: (childId, planId) => request(`/parental/child/${childId}/study-plan/${planId}/quiz-attempts`),
//     getMyConnections: () => request('/parental/my-connections'),
//     getPendingRequests: () => request('/parental/pending-requests'),
//     disconnect: (connectionId) => request(`/parental/disconnect/${connectionId}`, { method: 'POST' }),
//     cancelPending: (connectionId) => request(`/parental/cancel-pending/${connectionId}`, { method: 'POST' }),
// };

// ── WebSocket ───────────────────────────────────────
export function connectDashboardWS(token, onMessage) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const wsUrl = isLocal
        ? `ws://127.0.0.1:8000/ws?token=${encodeURIComponent(token)}`
        : `wss://polaris-api-wf4d.onrender.com/ws?token=${encodeURIComponent(token)}`;
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
            ws = new WebSocket(wsUrl);
            
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

// [V2+] AI / Learning API — uncomment when AI features are enabled
// export const ai = {
//     uploadDocument: (file) => {
//         const formData = new FormData();
//         formData.append('file', file);
//         return request('/ai/upload', { method: 'POST', body: formData });
//     },
//     getDocuments: () => request('/ai/documents'),
//     createStudyPlan: (data) => request('/ai/study-plan', { method: 'POST', body: JSON.stringify(data) }),
//     getStudyPlans: () => request('/ai/study-plans'),
//     getStudyPlan: (id) => request(`/ai/study-plan/${id}`),
//     getStudyPlanProgress: (planId) => request(`/ai/study-plan/${planId}/progress`),
//     markChapterComplete: (planId, chapterNumber) => 
//         request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/complete`, { method: 'POST' }),
//     updateChapterProgress: (planId, chapterNumber, watchedSeconds) =>
//         request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/update-progress`, {
//             method: 'POST',
//             body: JSON.stringify({ watched_seconds: watchedSeconds })
//         }),
//     setChapterVideo: (planId, chapterNumber, videoUrl, videoDuration, creatorName) =>
//         request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/set-video`, {
//             method: 'POST',
//             body: JSON.stringify({ 
//                 video_url: videoUrl, 
//                 video_duration_seconds: videoDuration,
//                 creator_name: creatorName 
//             })
//         }),
//     setPendingChapter: (planId, chapterIndex) =>
//         request('/ai/set-pending-chapter', {
//             method: 'POST',
//             body: JSON.stringify({ plan_id: planId, chapter_index: chapterIndex })
//         }),
//     resetChapter: (planId, chapterNumber) =>
//         request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/reset`, { method: 'POST' }),
//     getChapterSummary: (planId, chapterNumber) =>
//         request(`/ai/study-plan/${planId}/chapter/${chapterNumber}/summary`),
//     submitPlanQuiz: (planId, answers) => 
//         request(`/ai/study-plan/${planId}/quiz/submit`, { method: 'POST', body: JSON.stringify(answers) }),
//     getQuizAttempts: (planId) =>
//         request(`/ai/study-plan/${planId}/quiz-attempts`),
//     regenerateStudyPlan: (planId, options = null) =>
//         request(`/ai/study-plan/${planId}/regenerate`, {
//             method: 'POST',
//             body: JSON.stringify(options || {}),
//         }),
//     analyzeQuizResult: (planId) =>
//         request(`/ai/study-plan/${planId}/analyze-quiz`),
// };

// [V2+] Notifications API — uncomment when notifications are enabled
// export const notifications = {
//     getAll: (limit = 20) => request(`/notifications?limit=${limit}`),
//     markAsRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'POST' }),
//     delete: (notificationId) => request(`/notifications/${notificationId}`, { method: 'DELETE' }),
//     clearAll: () => request('/notifications/clear-all', { method: 'POST' }),
// };

// [V2+] Knowledge Intelligence (LCIE) API — uncomment when knowledge features are enabled
// export const knowledge = {
//     ingest: (data) => request('/knowledge/ingest', { method: 'POST', body: JSON.stringify(data) }),
//     getGraph: (category) => request(`/knowledge/graph${category ? '?category=' + encodeURIComponent(category) : ''}`),
//     getNodes: (params = {}) => {
//         const query = new URLSearchParams(params).toString();
//         return request(`/knowledge/nodes${query ? '?' + query : ''}`);
//     },
//     deleteNode: (nodeId) => request(`/knowledge/nodes/${nodeId}`, { method: 'DELETE' }),
//     getNodeSummary: (nodeId) => request(`/knowledge/summary/${nodeId}`),
//     getStats: () => request('/knowledge/stats'),
//     getSources: (params = {}) => {
//         const query = new URLSearchParams(params).toString();
//         return request(`/knowledge/sources${query ? '?' + query : ''}`);
//     },
//     getSessions: (params = {}) => {
//         const query = new URLSearchParams(params).toString();
//         return request(`/knowledge/sessions${query ? '?' + query : ''}`);
//     },
//     search: (q) => request(`/knowledge/search?q=${encodeURIComponent(q)}`),
//     getTopics: () => request('/knowledge/topics'),
// };

// [V2+] Learning Path Discovery API — uncomment when learning path features are enabled
// export const learningPath = {
//     getAll: () => request('/learning-path'),
//     getHistory: () => request('/learning-path/history'),
//     triggerAnalysis: () => request('/learning-path/analyze', { method: 'POST' }),
//     describe: (pathId) => request(`/learning-path/${pathId}/describe`, { method: 'POST' }),
// };

// [V2+] Knowledge Gaps API — uncomment when knowledge gaps features are enabled
// export const knowledgeGap = {
//     getAll: () => request('/knowledge-gaps'),
//     getHistory: () => request('/knowledge-gaps/history'),
//     getRecommendations: () => request('/knowledge-gaps/recommendations'),
//     triggerAnalysis: () => request('/knowledge-gaps/analyze', { method: 'POST' }),
// };

