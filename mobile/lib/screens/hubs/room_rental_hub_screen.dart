import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../room_rental/host_active_rentals_screen.dart';
import '../room_rental/host_agreements_screen.dart';
import '../room_rental/host_payments_screen.dart';
import '../room_rental/host_rental_requests_screen.dart';
import '../room_rental/my_agreements_screen.dart';
import '../room_rental/my_payments_screen.dart';
import '../room_rental/my_rental_requests_screen.dart';
import '../room_rental/my_rentals_screen.dart';
import '../room_rental/my_rooms_screen.dart';

class RoomRentalHubScreen extends StatelessWidget {
  const RoomRentalHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          '🏠 Room Rental',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.green,
                Colors.green.withValues(alpha: 0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionCard(
              context,
              title: 'As Tenant',
              icon: Icons.person_outline,
              color: Colors.green,
              items: [
                _HubItem(
                  icon: Icons.send_outlined,
                  title: 'My Requests',
                  subtitle: 'Your room requests',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyRentalRequestsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.description_outlined,
                  title: 'My Agreements',
                  subtitle: 'Your rental agreements',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyAgreementsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.home_outlined,
                  title: 'My Rentals',
                  subtitle: 'Currently renting rooms',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyRentalsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.payment_outlined,
                  title: 'Payments',
                  subtitle: 'Payment history',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyPaymentsScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildSectionCard(
              context,
              title: 'As Host',
              icon: Icons.home_work_outlined,
              color: Colors.green.shade700,
              items: [
                _HubItem(
                  icon: Icons.home_work_outlined,
                  title: 'My Rooms',
                  subtitle: 'Manage your room listings',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MyRoomsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.inbox_outlined,
                  title: 'Rental Requests',
                  subtitle: 'Incoming rental requests',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const HostRentalRequestsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.handshake_outlined,
                  title: 'Agreements',
                  subtitle: 'Manage tenant agreements',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const HostAgreementsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.home_filled,
                  title: 'Active Rentals',
                  subtitle: 'Currently rented rooms',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const HostActiveRentalsScreen(),
                      ),
                    );
                  },
                ),
                _HubItem(
                  icon: Icons.account_balance_wallet_outlined,
                  title: 'Payments',
                  subtitle: 'Track revenue & payments',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const HostPaymentsScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required List<_HubItem> items,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.1),
                  color.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(14),
                topRight: Radius.circular(14),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[800],
                  ),
                ),
              ],
            ),
          ),
          ...items,
        ],
      ),
    );
  }
}

class _HubItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _HubItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.grey[200]!),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppTheme.primaryColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}
