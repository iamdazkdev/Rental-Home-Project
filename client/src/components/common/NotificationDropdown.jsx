import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useSocket} from '../../context/SocketContext';
import {CONFIG, HTTP_METHODS} from '../../constants/api';
import { 
    Bell, CheckCircle, XCircle, Calendar, MessageSquare, 
    Star, ShieldCheck, Home, FileText, CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

    // Format title from snake_case to Title Case
    const formatNotificationTitle = (type) => {
        if (!type) return 'Notification';
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Get notification icon component
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_confirmed':
            case 'booking_approved':
                return <CheckCircle size={20} className="icon-success" />;
            case 'booking_cancelled':
            case 'booking_rejected':
                return <XCircle size={20} className="icon-error" />;
            case 'new_booking':
                return <Calendar size={20} className="icon-primary" />;
            case 'payment_received':
            case 'payment_reminder':
                return <FileText size={20} className="icon-warning" />;
            case 'new_message':
                return <MessageSquare size={20} className="icon-info" />;
            case 'review_received':
                return <Star size={20} className="icon-warning" />;
            case 'identity_verified':
                return <ShieldCheck size={20} className="icon-success" />;
            case 'rental_request':
                return <Home size={20} className="icon-primary" />;
            case 'agreement_signed':
                return <FileText size={20} className="icon-success" />;
            default:
                return <Bell size={20} className="icon-default" />;
        }
    };

    // Get time ago using date-fns
    const getTimeAgo = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (e) {
            return new Date(date).toLocaleDateString();
        }
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
                className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={24} strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="mark-all-read" title="Mark all as read">
                                <CheckCheck size={16} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={40} className="empty-icon" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon-wrapper">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title || formatNotificationTitle(notification.type)}
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

