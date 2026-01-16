import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSocket} from '../../context/SocketContext';
import {CONFIG, HTTP_METHODS} from '../../constants/api';
import './NotificationDropdown.scss';

const NotificationDropdown = ({user}) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const {socket} = useSocket();

    const userId = user?._id || user?.id;

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${CONFIG.API_BASE_URL}/notifications/${userId}`,
                {
                    method: HTTP_METHODS.GET,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/notifications/${notificationId}/read`, {
                method: HTTP_METHODS.PUT,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // Update local state
            setNotifications((prev) =>
                prev.map((n) => (n._id === notificationId ? {...n, isRead: true} : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!userId) return;

        try {
            await fetch(`${CONFIG.API_BASE_URL}/notifications/${userId}/read-all`, {
                method: HTTP_METHODS.PUT,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            setNotifications((prev) => prev.map((n) => ({...n, isRead: true})));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        setIsOpen(false);

        if (notification.link) {
            navigate(notification.link);
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_confirmed':
            case 'booking_approved':
                return '✅';
            case 'booking_cancelled':
            case 'booking_rejected':
                return '❌';
            case 'new_booking':
                return '📅';
            case 'payment_received':
            case 'payment_reminder':
                return '💰';
            case 'new_message':
                return '💬';
            case 'review_received':
                return '⭐';
            case 'identity_verified':
                return '🔐';
            case 'rental_request':
                return '🏠';
            case 'agreement_signed':
                return '📝';
            default:
                return '🔔';
        }
    };

    // Get time ago
    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Socket listener for new notifications
    useEffect(() => {
        if (!socket || !userId) return;

        const handleNewNotification = (data) => {
            console.log('🔔 New notification received:', data);

            // Add to notifications list
            setNotifications((prev) => [data.notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(data.notification.title || 'New Notification', {
                    body: data.notification.message,
                    icon: '/favicon-32.svg',
                    badge: '/favicon-32.svg',
                    tag: data.notification._id,
                });
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications on mount
    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds as backup
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [userId]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!userId) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="mark-all-read">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title || notification.type}
                                        </div>
                                        <div className="notification-message">{notification.message}</div>
                                        <div className="notification-time">{getTimeAgo(notification.createdAt)}</div>
                                    </div>
                                    {!notification.isRead && <div className="notification-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="notification-footer">
                            <button onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}>
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

