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
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Profile',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withValues(alpha: 0.8)
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
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
                  _buildQuickAccessCards(context),
                  const SizedBox(height: 24),

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
                        title: 'Entire Place Listings',
                        subtitle: 'Manage entire place rentals',
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
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor.withValues(alpha: 0.1),
            AppTheme.primaryColor.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.primaryColor.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppTheme.primaryColor.withValues(alpha: 0.3),
                width: 3,
              ),
            ),
            child: CircleAvatar(
              radius: 40,
              backgroundColor: Colors.white,
              backgroundImage: user.profileImage != null
                  ? NetworkImage(user.profileImage!)
                  : null,
              child: user.profileImage == null
                  ? Icon(Icons.person, size: 40, color: AppTheme.primaryColor)
                  : null,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.fullName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  user.email,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const EditProfileScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit Profile'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryColor,
                    side: BorderSide(color: AppTheme.primaryColor),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAccessCards(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Access',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickCard(
                icon: Icons.message_outlined,
                title: 'Messages',
                color: Colors.blue,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MessagesScreen(),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickCard(
                icon: Icons.favorite_outline,
                title: 'Wishlist',
                color: Colors.red,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const WishlistScreen(),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withValues(alpha: 0.3),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader_OLD(BuildContext context, user) {
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
    return Container(
      margin: const EdgeInsets.only(top: 12, bottom: 8, left: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppTheme.primaryColor,
          letterSpacing: 0.5,
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
    // Extract emoji and text from title
    final parts = title.split(' ');
    final emoji = parts.first;
    final text = parts.skip(1).join(' ');

    // Assign color based on section
    Color sectionColor = AppTheme.primaryColor;
    if (title.contains('Entire Place')) {
      sectionColor = Colors.blue;
    } else if (title.contains('Room Rental')) {
      sectionColor = Colors.green;
    } else if (title.contains('Roommate')) {
      sectionColor = Colors.orange;
    }

    return Column(
      children: [
        InkWell(
          onTap: onToggle,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  sectionColor.withValues(alpha: 0.1),
                  sectionColor.withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: sectionColor.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: sectionColor.withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: Text(
                    emoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    text,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: sectionColor.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: sectionColor,
                  ),
                ),
              ],
            ),
          ),
        ),
        if (isExpanded) ...[
          const SizedBox(height: 8),
          ...children,
        ],
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
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 8,
        ),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primaryColor, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
        trailing: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.chevron_right,
            color: Colors.grey[600],
            size: 20,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
