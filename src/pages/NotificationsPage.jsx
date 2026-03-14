import { useState, useEffect } from 'react';
import { Bell, Trash2, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '../api';

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notificationList, setNotificationList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await notifications.getAll(100);
                setNotificationList(response.notifications || []);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notifications.markAsRead(notificationId);
            setNotificationList(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notifications.delete(notificationId);
            setNotificationList(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleClearAll = async () => {
        if (window.confirm('Clear all notifications?')) {
            try {
                await notifications.clearAll();
                setNotificationList([]);
            } catch (error) {
                console.error('Failed to clear notifications:', error);
            }
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notificationList.filter(n => !n.is_read)
        : notificationList;

    const unreadCount = notificationList.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-black text-white pt-20 pb-12">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Bell size={32} />
                                Notifications
                            </h1>
                            <p className="text-zinc-500 mt-1">
                                {filteredNotifications.length} {filter === 'unread' ? 'unread' : 'total'} notification{filteredNotifications.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {notificationList.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="px-4 py-2 text-sm font-semibold uppercase tracking-widest bg-red-950/20 border border-red-900/20 text-red-400 hover:bg-red-950/30 transition-colors rounded-lg"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {notificationList.length > 0 && (
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
                                filter === 'all'
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                            }`}
                        >
                            All ({notificationList.length})
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => setFilter('unread')}
                                className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
                                    filter === 'unread'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-950/20 text-blue-400 hover:text-blue-300'
                                }`}
                            >
                                Unread ({unreadCount})
                            </button>
                        )}
                    </div>
                )}

                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-zinc-500">
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <Bell size={48} className="mx-auto text-zinc-600 mb-3 opacity-50" />
                            <p className="text-zinc-500">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                    notification.is_read
                                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                        : 'bg-blue-950/20 border-blue-900/30 hover:bg-blue-950/30'
                                }`}
                            >
                                {/* Notification Header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-white">
                                                {notification.title}
                                            </h3>
                                            {!notification.is_read && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Notification Type Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-block px-2 py-1 text-[10px] font-mono uppercase tracking-widest bg-white/5 text-zinc-500 rounded">
                                        {notification.type}
                                    </span>
                                    <span className="text-xs text-zinc-600">
                                        {formatTime(notification.created_at)}
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 transition-colors rounded text-white"
                                        >
                                            <Check size={14} />
                                            Mark Read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 hover:border-red-900/40 text-red-400 transition-colors rounded"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Format relative time
function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}
