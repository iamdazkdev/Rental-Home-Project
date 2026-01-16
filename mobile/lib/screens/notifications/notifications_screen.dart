import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../providers/notification_provider.dart';

/// Notifications List Screen
/// Displays all push notifications received by the user
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, _) {
              if (provider.notifications.isEmpty) return const SizedBox();

              return PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'mark_all_read') {
                    provider.markAllAsRead();
                  } else if (value == 'clear_all') {
                    _showClearAllDialog(context, provider);
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'mark_all_read',
                    child: Text('Mark all as read'),
                  ),
                  const PopupMenuItem(
                    value: 'clear_all',
                    child: Text('Clear all'),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.notifications.isEmpty) {
            return RefreshIndicator(
              onRefresh: () => provider.fetchNotifications(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height - 100,
                  child: _buildEmptyState(context),
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.fetchNotifications(),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: provider.notifications.length,
              itemBuilder: (context, index) {
                final notification = provider.notifications[index];
                return _buildNotificationItem(context, notification, provider);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 80,
            color:
                Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).textTheme.bodyLarge?.color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You\'ll see notifications here',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem(
    BuildContext context,
    Map<String, dynamic> notification,
    NotificationProvider provider,
  ) {
    // Safely cast the notification data
    final notificationData = Map<String, dynamic>.from(notification);
    final bool isRead = notificationData['isRead'] ?? false;
    final String title = notificationData['title'] ?? 'Notification';
    final String body = notificationData['body'] ?? '';
    final String timestamp = notificationData['timestamp'] ?? '';
    final Map<String, dynamic> data = notificationData['data'] is Map
        ? Map<String, dynamic>.from(notificationData['data'] as Map)
        : {};

    return Dismissible(
      key: Key(notificationData['id'].toString()),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) {
        // Delete notification
        provider.deleteNotification(notificationData['id'].toString());
      },
      child: InkWell(
        onTap: () {
          if (!isRead) {
            provider.markAsRead(notificationData['id'].toString());
          }
          _handleNotificationTap(context, data);
        },
        child: Container(
          color: isRead
              ? Theme.of(context).cardColor
              : Theme.of(context).primaryColor.withValues(alpha: 0.05),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _getNotificationColor(data['type'])
                      .withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    _getNotificationIcon(data['type']),
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight:
                                  isRead ? FontWeight.w500 : FontWeight.w600,
                            ),
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Theme.of(context).primaryColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: Theme.of(context).textTheme.bodyMedium,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _formatTimestamp(timestamp),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getNotificationIcon(String? type) {
    switch (type) {
      case 'new_booking':
        return '📅';
      case 'booking_confirmed':
        return '✅';
      case 'booking_cancelled':
        return '❌';
      case 'new_message':
        return '💬';
      case 'payment_received':
        return '💰';
      case 'payment_reminder':
        return '💰';
      case 'review_received':
        return '⭐';
      case 'identity_verified':
        return '🔐';
      default:
        return '🔔';
    }
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'new_booking':
      case 'booking_confirmed':
        return Colors.green;
      case 'booking_cancelled':
        return Colors.red;
      case 'new_message':
        return Colors.purple;
      case 'payment_received':
      case 'payment_reminder':
        return Colors.blue;
      case 'review_received':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatTimestamp(String timestamp) {
    try {
      final dateTime = DateTime.parse(timestamp);
      return timeago.format(dateTime);
    } catch (e) {
      return '';
    }
  }

  void _handleNotificationTap(BuildContext context, Map<String, dynamic> data) {
    final String? type = data['type'];
    final String? id = data['id'];

    // Navigate based on notification type
    switch (type) {
      case 'new_booking':
      case 'booking_confirmed':
      case 'booking_cancelled':
        // Navigate to booking details
        // Navigator.pushNamed(context, '/booking-details', arguments: id);
        debugPrint('Navigate to booking: $id');
        break;

      case 'new_message':
        // Navigate to chat
        // Navigator.pushNamed(context, '/chat', arguments: id);
        debugPrint('Navigate to chat: $id');
        break;

      case 'payment_reminder':
        // Navigate to payment
        // Navigator.pushNamed(context, '/payment', arguments: id');
        debugPrint('Navigate to payment: $id');
        break;

      default:
        debugPrint('Unknown notification type: $type');
    }
  }

  void _showClearAllDialog(
      BuildContext context, NotificationProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Notifications'),
        content: const Text(
            'Are you sure you want to clear all notifications? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              provider.clearAll();
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}
