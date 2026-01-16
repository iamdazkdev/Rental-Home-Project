import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../models/listing.dart';
import '../../providers/auth_provider.dart';
import '../../services/listing_service.dart';
import '../host/host_calendar_screen.dart';
import '../listings/listing_detail_screen.dart';
import 'edit_property_screen.dart';

class MyPropertiesScreen extends StatefulWidget {
  const MyPropertiesScreen({super.key});

  @override
  State<MyPropertiesScreen> createState() => _MyPropertiesScreenState();
}

class _MyPropertiesScreenState extends State<MyPropertiesScreen>
    with SingleTickerProviderStateMixin {
  final ListingService _listingService = ListingService();
  late TabController _tabController;

  List<Listing> _allListings = [];
  List<Listing> _activeListings = [];
  List<Listing> _inactiveListings = [];
  bool _isLoading = true;

  // Format price helper
  String formatPrice(double price) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(price)} VND';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadMyProperties();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadMyProperties() async {
    setState(() => _isLoading = true);

    final user = context.read<AuthProvider>().user;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final listings = await _listingService.getMyListings(user.id);

      debugPrint('📊 Total listings fetched: ${listings.length}');
      for (var listing in listings) {
        debugPrint(
            '  - ${listing.title}: type="${listing.type}", isActive=${listing.isActive}');
      }

      // Filter only Entire Place listings (exclude Room(s))
      // Check for both "Entire Place" and "An entire place" to be safe
      final entirePlaceListings = listings.where((l) {
        final type = l.type.toLowerCase();
        return type.contains('entire') || type == 'entire place';
      }).toList();

      debugPrint('🏡 Entire Place listings: ${entirePlaceListings.length}');

      setState(() {
        _allListings = entirePlaceListings;
        _activeListings = entirePlaceListings.where((l) => l.isActive).toList();
        _inactiveListings =
            entirePlaceListings.where((l) => !l.isActive).toList();
        _isLoading = false;
      });

      debugPrint(
          '✅ Active: ${_activeListings.length}, Inactive: ${_inactiveListings.length}');
    } catch (e) {
      debugPrint('❌ Error loading entire place listings: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleListingStatus(Listing listing) async {
    try {
      final newStatus = !(listing.isActive);
      final success = await _listingService.updateListingStatus(
        listing.id,
        newStatus,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus ? '✅ Listing activated' : '📴 Listing deactivated',
            ),
            backgroundColor: newStatus ? Colors.green : Colors.orange,
          ),
        );
        await _loadMyProperties();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _deleteListing(Listing listing) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Listing'),
        content: Text('Are you sure you want to delete "${listing.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        final success = await _listingService.deleteListing(listing.id);

        if (success == true && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Listing deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
          await _loadMyProperties();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

  void _navigateToEdit(Listing listing) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditPropertyScreen(propertyId: listing.id),
      ),
    ).then((updated) {
      // Reload properties if changes were saved
      if (updated == true) {
        _loadMyProperties();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Entire Place Listings'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Active (${_activeListings.length})'),
            Tab(text: 'Inactive (${_inactiveListings.length})'),
          ],
        ),
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.pushNamed(context, '/create-listing');
        },
        backgroundColor: AppTheme.primaryColor,
        icon: const Icon(Icons.add),
        label: const Text('Add Entire Place'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_allListings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.home_work_outlined, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No entire place listings yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Start by listing your first entire place rental',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, '/create-listing');
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Entire Place'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildListingsList(_activeListings),
        _buildListingsList(_inactiveListings),
      ],
    );
  }

  Widget _buildListingsList(List<Listing> listings) {
    if (listings.isEmpty) {
      return Center(
        child: Text(
          'No listings in this category',
          style: TextStyle(color: Colors.grey[600]),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadMyProperties,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: listings.length,
        itemBuilder: (context, index) => _buildListingCard(listings[index]),
      ),
    );
  }

  Widget _buildListingCard(Listing listing) {
    final isActive = listing.isActive;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ListingDetailScreen(listingId: listing.id),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image with status badge
            Stack(
              children: [
                if (listing.mainPhoto != null)
                  CachedNetworkImage(
                    imageUrl: listing.mainPhoto!,
                    height: 160,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      height: 160,
                      color: Colors.grey[300],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 160,
                      color: Colors.grey[300],
                      child: const Icon(Icons.home_work, size: 50),
                    ),
                  )
                else
                  Container(
                    height: 160,
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.home_work, size: 50),
                    ),
                  ),

                // Status Badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.green : Colors.grey,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isActive ? 'Active' : 'Inactive',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Details
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Type
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          listing.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          listing.type,
                          style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      const Icon(Icons.location_on,
                          size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          listing.shortAddress,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Price
                  Text(
                    '${formatPrice(listing.price)}/${listing.priceType ?? 'night'}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _navigateToEdit(listing),
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Edit'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primaryColor,
                            side:
                                const BorderSide(color: AppTheme.primaryColor),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => HostCalendarScreen(
                                  listingId: listing.id,
                                  listingTitle: listing.title,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.calendar_month, size: 16),
                          label: const Text('Calendar'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blue,
                            side: const BorderSide(color: Colors.blue),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Second row of action buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _toggleListingStatus(listing),
                          icon: Icon(
                            isActive ? Icons.visibility_off : Icons.visibility,
                            size: 16,
                          ),
                          label: Text(isActive ? 'Hide' : 'Show'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor:
                                isActive ? Colors.orange : Colors.green,
                            side: BorderSide(
                              color: isActive ? Colors.orange : Colors.green,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _deleteListing(listing),
                          icon: const Icon(Icons.delete, size: 16),
                          label: const Text('Delete'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
