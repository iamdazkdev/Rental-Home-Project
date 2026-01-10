import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../bookings/booking_history_screen.dart';
import '../host/booking_requests_screen.dart';
import '../messages/messages_screen.dart';
import '../properties/my_properties_screen.dart';
import '../room_rental/host_active_rentals_screen.dart';
import '../room_rental/host_agreements_screen.dart';
import '../room_rental/host_payments_screen.dart';
import '../room_rental/host_rental_requests_screen.dart';
import '../room_rental/my_agreements_screen.dart';
import '../room_rental/my_payments_screen.dart';
import '../room_rental/my_rental_requests_screen.dart';
import '../room_rental/my_rentals_screen.dart';
import '../room_rental/my_rooms_screen.dart';
import '../roommate/my_roommate_posts_screen.dart';
import '../roommate/my_roommate_requests_screen.dart';
import '../roommate/roommate_search_screen.dart';
import '../wishlist/wishlist_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Collapsible sections state
  bool _entirePlaceExpanded = false;
  bool _roomRentalExpanded = false;
  bool _roommateExpanded = false;

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const EditProfileScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Profile Header
                  _buildProfileHeader(context, user),
                  const SizedBox(height: 24),

                  // Quick Access Section
                  _buildSectionTitle('Quick Access'),
                  _MenuItem(
                    icon: Icons.message_outlined,
                    title: 'Messages',
                    subtitle: 'Chat with hosts and guests',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MessagesScreen(),
                        ),
                      );
                    },
                  ),
                  _MenuItem(
                    icon: Icons.favorite_outline,
                    title: 'Wishlist',
                    subtitle: 'Your favorite places',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const WishlistScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),
                  const Divider(),

                  // Entire Place Rental Section
                  _buildCollapsibleSection(
                    title: '🏡 Entire Place Rental',
                    isExpanded: _entirePlaceExpanded,
                    onToggle: () {
                      setState(() {
                        _entirePlaceExpanded = !_entirePlaceExpanded;
                      });
                    },
                    children: [
                      _buildSubsectionTitle('Guest'),
                      _MenuItem(
                        icon: Icons.history,
                        title: 'Booking History',
                        subtitle: 'View your bookings & trips',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const BookingHistoryScreen(),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      _buildSubsectionTitle('Host'),
                      _MenuItem(
                        icon: Icons.home_work_outlined,
                        title: 'Properties',
                        subtitle: 'Manage your listings',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const MyPropertiesScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
                        icon: Icons.event_note,
                        title: 'Booking Requests',
                        subtitle: 'Manage guest requests',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const BookingRequestsScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),
                  const Divider(),

                  // Room Rental Section
                  _buildCollapsibleSection(
                    title: '🏠 Room Rental',
                    isExpanded: _roomRentalExpanded,
                    onToggle: () {
                      setState(() {
                        _roomRentalExpanded = !_roomRentalExpanded;
                      });
                    },
                    children: [
                      _buildSubsectionTitle('Tenant'),
                      // _MenuItem(
                      //   icon: Icons.search,
                      //   title: 'Browse Rooms',
                      //   subtitle: 'Find available rooms',
                      //   onTap: () {
                      //     Navigator.push(
                      //       context,
                      //       MaterialPageRoute(
                      //         builder: (context) =>
                      //             const RoomRentalSearchScreen(),
                      //       ),
                      //     );
                      //   },
                      // ),
                      _MenuItem(
                        icon: Icons.send_outlined,
                        title: 'My Requests',
                        subtitle: 'Your room requests',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const MyRentalRequestsScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
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
                      _MenuItem(
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
                      _MenuItem(
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
                      const SizedBox(height: 8),
                      _buildSubsectionTitle('Host'),
                      _MenuItem(
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
                      _MenuItem(
                        icon: Icons.inbox_outlined,
                        title: 'Rental Requests',
                        subtitle: 'Incoming rental requests',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const HostRentalRequestsScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
                        icon: Icons.handshake_outlined,
                        title: 'Agreements',
                        subtitle: 'Manage tenant agreements',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const HostAgreementsScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
                        icon: Icons.home_filled,
                        title: 'Active Rentals',
                        subtitle: 'Currently rented rooms',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const HostActiveRentalsScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
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

                  const SizedBox(height: 8),
                  const Divider(),

                  // Roommate Section
                  _buildCollapsibleSection(
                    title: '👥 Find Roommate',
                    isExpanded: _roommateExpanded,
                    onToggle: () {
                      setState(() {
                        _roommateExpanded = !_roommateExpanded;
                      });
                    },
                    children: [
                      _MenuItem(
                        icon: Icons.people_outline,
                        title: 'Find Roommates',
                        subtitle: 'Search roommate posts',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const RoommateSearchScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
                        icon: Icons.article_outlined,
                        title: 'My Posts',
                        subtitle: 'Your roommate posts',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const MyRoommatePostsScreen(),
                            ),
                          );
                        },
                      ),
                      _MenuItem(
                        icon: Icons.mail_outline,
                        title: 'My Requests',
                        subtitle: 'View and manage requests',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const MyRoommateRequestsScreen(),
                            ),
                          );
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),
                  const Divider(),

                  // Settings
                  _MenuItem(
                    icon: Icons.settings_outlined,
                    title: 'Settings',
                    subtitle: 'Account settings',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const EditProfileScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 16),

                  // Logout Button
                  OutlinedButton.icon(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Logout'),
                          content:
                              const Text('Are you sure you want to logout?'),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context, false),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(context, true),
                              child: const Text('Logout'),
                            ),
                          ],
                        ),
                      );

                      if (confirm == true && context.mounted) {
                        await authProvider.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushReplacementNamed('/login');
                        }
                      }
                    },
                    icon: const Icon(Icons.logout),
                    label: const Text('Logout'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.errorColor,
                      side: const BorderSide(color: AppTheme.errorColor),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, user) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const EditProfileScreen(),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
              backgroundImage: user.profileImage != null
                  ? NetworkImage(user.profileImage!)
                  : null,
              child: user.profileImage == null
                  ? const Icon(Icons.person,
                      size: 40, color: AppTheme.primaryColor)
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.fullName,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: TextStyle(
                      fontSize: 14,
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

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
      ),
    );
  }

  Widget _buildSubsectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 8, bottom: 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Colors.grey[600],
        ),
      ),
    );
  }

  Widget _buildCollapsibleSection({
    required String title,
    required bool isExpanded,
    required VoidCallback onToggle,
    required List<Widget> children,
  }) {
    return Column(
      children: [
        Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isExpanded ? Icons.expand_less : Icons.expand_more,
                color: AppTheme.primaryColor,
              ),
            ),
            title: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            trailing: Icon(
              isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
              color: AppTheme.primaryColor,
            ),
            onTap: onToggle,
          ),
        ),
        if (isExpanded) ...children,
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
