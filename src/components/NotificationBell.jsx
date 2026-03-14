import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '../api';

export default function NotificationBell() {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread count periodically
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await notifications.getAll(1);
                setUnreadCount(response.unread_count || 0);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="View all notifications"
        >
            <Bell size={18} />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}

