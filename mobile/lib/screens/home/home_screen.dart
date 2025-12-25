import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';
import '../../config/app_constants.dart';
import '../../models/listing.dart';
import '../../services/listing_service.dart';
import '../../services/wishlist_service.dart';
import '../../utils/price_formatter.dart';
import '../listings/listing_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ListingService _listingService = ListingService();
  String _selectedCategory = 'All';
  String? _selectedType; // null means "All"
  List<Listing> _listings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadListings();
  }

  Future<void> _loadListings() async {
    debugPrint('🏠 HomeScreen: Loading listings for category: $_selectedCategory, type: $_selectedType');

    setState(() {
      _isLoading = true;
    });

    // Get current user ID
    final authProvider = context.read<AuthProvider>();
    final currentUserId = authProvider.user?.id;

    // Get all listings first
    List<Listing> listings = await _listingService.getListings(
      category: _selectedCategory == 'All' ? null : _selectedCategory,
    );

    debugPrint('🏠 HomeScreen: Received ${listings.length} listings before filtering');

    // Filter out current user's own listings
    if (currentUserId != null) {
      listings = listings.where((listing) {
        // listing.creator is String (creator ID)
        final isOwnListing = listing.creator == currentUserId;
        if (isOwnListing) {
          debugPrint('🚫 Filtering out own listing: ${listing.title}');
        }
        return !isOwnListing;
      }).toList();
      debugPrint('🏠 HomeScreen: After filtering own listings: ${listings.length} listings');
    }

    // Filter by type locally if selected
    if (_selectedType != null) {
      listings = listings.where((listing) => listing.type == _selectedType).toList();
      debugPrint('🏠 HomeScreen: Filtered to ${listings.length} listings of type: $_selectedType');
    }

    debugPrint('🏠 HomeScreen: Final count: ${listings.length} listings');

    setState(() {
      _listings = listings;
      _isLoading = false;
    });

    if (listings.isEmpty) {
      debugPrint('⚠️ HomeScreen: No listings found!');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.home_rounded, color: AppTheme.primaryColor),
            const SizedBox(width: 8),
            Text(
              'Rental Home',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Navigate to notifications
            },
          ),
          if (user?.profileImage != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CircleAvatar(
                backgroundImage: NetworkImage(user!.profileImage!),
                radius: 18,
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Categories
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: AppConstants.categories.length,
              itemBuilder: (context, index) {
                final category = AppConstants.categories[index];
                final isSelected = category == _selectedCategory;

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(category),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategory = category;
                      });
                      _loadListings();
                    },
                    backgroundColor: AppTheme.backgroundColor,
                    selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),
          // Property Types Filter
          Container(
            height: 50,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              border: Border(
                top: BorderSide(color: AppTheme.borderColor, width: 1),
                bottom: BorderSide(color: AppTheme.borderColor, width: 1),
              ),
            ),
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                // All Types
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: const Text('All Types'),
                    selected: _selectedType == null,
                    onSelected: (selected) {
                      setState(() {
                        _selectedType = null;
                      });
                      _loadListings();
                    },
                    backgroundColor: Colors.white,
                    selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                    checkmarkColor: AppTheme.primaryColor,
                    labelStyle: TextStyle(
                      color: _selectedType == null ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
                      fontWeight: _selectedType == null ? FontWeight.w600 : FontWeight.normal,
                      fontSize: 13,
                    ),
                    side: BorderSide(
                      color: _selectedType == null ? AppTheme.primaryColor : AppTheme.borderColor,
                    ),
                  ),
                ),
                // Property Types
                ...AppConstants.types.map((type) {
                  final isSelected = type == _selectedType;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(type),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedType = selected ? type : null;
                        });
                        _loadListings();
                      },
                      backgroundColor: Colors.white,
                      selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                      checkmarkColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(
                        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        fontSize: 13,
                      ),
                      side: BorderSide(
                        color: isSelected ? AppTheme.primaryColor : AppTheme.borderColor,
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          // Listings
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _listings.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.home_work_outlined,
                              size: 80,
                              color: AppTheme.textLightColor,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No listings available',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            if (_selectedType != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Try changing the property type filter',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.textSecondaryColor,
                                ),
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadListings,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.75,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: _listings.length,
                          itemBuilder: (context, index) {
                            final listing = _listings[index];
                            return _ListingCard(listing: listing);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _ListingCard extends StatefulWidget {
  final Listing listing;

  const _ListingCard({required this.listing});

  @override
  State<_ListingCard> createState() => _ListingCardState();
}

class _ListingCardState extends State<_ListingCard> {
  final WishlistService _wishlistService = WishlistService();
  bool _isInWishlist = false;
  bool _isToggling = false;

  @override
  void initState() {
    super.initState();
    _checkWishlistStatus();
  }

  void _checkWishlistStatus() {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      setState(() {
        _isInWishlist = user.wishlist.contains(widget.listing.id);
      });
    }
  }

  Future<void> _toggleWishlist() async {
    if (_isToggling) return;

    setState(() => _isToggling = true);

    final result = await _wishlistService.toggleWishlist(widget.listing.id);

    if (result['success']) {
      setState(() {
        _isInWishlist = !_isInWishlist;
      });

      // Update user wishlist in provider
      if (!mounted) return;
      final authProvider = context.read<AuthProvider>();
      final updatedUser = authProvider.user!.copyWith(
        wishlist: List<String>.from(result['wishlist']),
      );
      authProvider.updateUser(updatedUser);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isInWishlist ? 'Added to wishlist' : 'Removed from wishlist'),
            duration: const Duration(seconds: 1),
          ),
        );
      }
    }

    setState(() => _isToggling = false);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListingDetailScreen(listingId: widget.listing.id),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderColor),
          color: AppTheme.surfaceColor,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image with wishlist button
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Stack(
                children: [
                  widget.listing.mainPhoto != null
                      ? Image.network(
                          widget.listing.mainPhoto!,
                          height: 120,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              height: 120,
                              color: AppTheme.backgroundColor,
                              child: const Icon(Icons.home_work_outlined, size: 40),
                            );
                          },
                        )
                      : Container(
                          height: 120,
                          color: AppTheme.backgroundColor,
                          child: const Icon(Icons.home_work_outlined, size: 40),
                        ),
                  // Wishlist button
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: _toggleWishlist,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: _isToggling
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Icon(
                                _isInWishlist ? Icons.favorite : Icons.favorite_border,
                                color: _isInWishlist ? Colors.red : Colors.grey.shade700,
                                size: 20,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.listing.title,
                          style: Theme.of(context).textTheme.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.listing.shortAddress,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Text(
                          formatVND(widget.listing.price, showCurrency: false),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        Text(
                          ' VND/${widget.listing.priceType ?? 'night'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

