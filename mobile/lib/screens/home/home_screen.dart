import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/app_constants.dart';
import '../../config/app_theme.dart';
import '../../models/listing.dart';
import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/listing_service.dart';
import '../../services/roommate_service.dart';
import '../../services/wishlist_service.dart';
import '../../utils/price_formatter.dart';
import '../listings/listing_detail_screen.dart';
import '../notifications/notifications_screen.dart';
import '../roommate/roommate_post_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ListingService _listingService = ListingService();
  final RoommateService _roommateService = RoommateService();

  String _selectedCategory = 'All';
  String? _selectedType; // null means "All"

  List<Listing> _listings = [];
  List<RoommatePost> _roommatePosts = [];
  bool _isLoading = true;

  // Helper to check if showing roommate posts
  bool get _isShowingRoommatePosts => _selectedType == 'A Shared Room';

  @override
  void initState() {
    super.initState();
    _loadListings();
  }

  Future<void> _loadListings() async {
    debugPrint(
        '🏠 HomeScreen: Loading data for category: $_selectedCategory, type: $_selectedType');

    setState(() {
      _isLoading = true;
    });

    // Get current user ID
    final authProvider = context.read<AuthProvider>();
    final currentUserId = authProvider.user?.id;

    // If "A Shared Room" is selected, load roommate posts instead
    if (_selectedType == 'A Shared Room') {
      debugPrint('🏠 HomeScreen: Loading roommate posts via search API');

      try {
        // Call search API without any filters to get all active posts
        List<RoommatePost> posts = await _roommateService.searchPosts();

        debugPrint(
            '🏠 HomeScreen: Received ${posts.length} roommate posts from API');

        // Filter out current user's own posts
        if (currentUserId != null) {
          final beforeCount = posts.length;
          posts = posts.where((post) {
            final isOwnPost = post.userId == currentUserId;
            if (isOwnPost) {
              debugPrint('🚫 Filtering out own roommate post: ${post.title}');
            }
            return !isOwnPost;
          }).toList();
          debugPrint(
              '🏠 HomeScreen: After filtering own posts: ${posts.length}/$beforeCount posts');
        }

        setState(() {
          _roommatePosts = posts;
          _listings = []; // Clear listings when showing roommate posts
          _isLoading = false;
        });

        if (posts.isEmpty) {
          debugPrint('⚠️ HomeScreen: No roommate posts found after filtering!');
        } else {
          debugPrint(
              '✅ HomeScreen: Successfully loaded ${posts.length} roommate posts');
        }
      } catch (e) {
        debugPrint('❌ Error loading roommate posts: $e');
        setState(() {
          _roommatePosts = [];
          _isLoading = false;
        });
      }

      return;
    }

    // Otherwise, load regular listings
    debugPrint('🏠 HomeScreen: Loading regular listings');

    List<Listing> listings = await _listingService.getListings(
      category: _selectedCategory == 'All' ? null : _selectedCategory,
    );

    debugPrint(
        '🏠 HomeScreen: Received ${listings.length} listings before filtering');

    // Filter out current user's own listings
    if (currentUserId != null) {
      listings = listings.where((listing) {
        final isOwnListing = listing.creator == currentUserId;
        if (isOwnListing) {
          debugPrint('🚫 Filtering out own listing: ${listing.title}');
        }
        return !isOwnListing;
      }).toList();
      debugPrint(
          '🏠 HomeScreen: After filtering own listings: ${listings.length} listings');
    }

    // Filter by type locally if selected (but not "A Shared Room")
    if (_selectedType != null && _selectedType != 'A Shared Room') {
      listings =
          listings.where((listing) => listing.type == _selectedType).toList();
      debugPrint(
          '🏠 HomeScreen: Filtered to ${listings.length} listings of type: $_selectedType');
    }

    debugPrint('🏠 HomeScreen: Final count: ${listings.length} listings');

    setState(() {
      _listings = listings;
      _roommatePosts = []; // Clear roommate posts when showing listings
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
          // Notification icon with badge
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, child) {
              final unreadCount = notificationProvider.unreadCount;

              return Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const NotificationsScreen(),
                        ),
                      );
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          unreadCount > 9 ? '9+' : '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
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
            height: 60,
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
                      color: isSelected
                          ? AppTheme.primaryColor
                          : AppTheme.textSecondaryColor,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.normal,
                    ),
                  ),
                );
              },
            ),
          ),
          // Property Types Filter
          Container(
            height: 60,
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
                      color: _selectedType == null
                          ? AppTheme.primaryColor
                          : AppTheme.textSecondaryColor,
                      fontWeight: _selectedType == null
                          ? FontWeight.w600
                          : FontWeight.normal,
                      fontSize: 13,
                    ),
                    side: BorderSide(
                      color: _selectedType == null
                          ? AppTheme.primaryColor
                          : AppTheme.borderColor,
                    ),
                  ),
                ),
                // Property Types
                ...AppConstants.propertyTypes.map((type) {
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
                      selectedColor:
                          AppTheme.primaryColor.withValues(alpha: 0.2),
                      checkmarkColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : AppTheme.textSecondaryColor,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.normal,
                        fontSize: 13,
                      ),
                      side: BorderSide(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : AppTheme.borderColor,
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
          // Listings or Roommate Posts
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _isShowingRoommatePosts
                    ? _buildRoommatePostsGrid()
                    : _buildListingsGrid(),
          ),
        ],
      ),
    );
  }

  // Build listings grid
  Widget _buildListingsGrid() {
    if (_listings.isEmpty) {
      return Center(
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
      );
    }

    return RefreshIndicator(
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
    );
  }

  // Build roommate posts grid
  Widget _buildRoommatePostsGrid() {
    if (_roommatePosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.people_outline,
              size: 80,
              color: AppTheme.textLightColor,
            ),
            const SizedBox(height: 16),
            Text(
              'No roommate posts available',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to create a roommate post!',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondaryColor,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadListings,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: _roommatePosts.length,
        itemBuilder: (context, index) {
          final post = _roommatePosts[index];
          return _RoommatePostCard(post: post);
        },
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
            content: Text(
                _isInWishlist ? 'Added to wishlist' : 'Removed from wishlist'),
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
            builder: (context) =>
                ListingDetailScreen(listingId: widget.listing.id),
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
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
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
                              child: const Icon(Icons.home_work_outlined,
                                  size: 40),
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
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Icon(
                                _isInWishlist
                                    ? Icons.favorite
                                    : Icons.favorite_border,
                                color: _isInWishlist
                                    ? Colors.red
                                    : Colors.grey.shade700,
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
                        Flexible(
                          child: Text(
                            formatVND(widget.listing.price,
                                showCurrency: false),
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                            overflow: TextOverflow.ellipsis,
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

// Roommate Post Card Widget
class _RoommatePostCard extends StatelessWidget {
  final RoommatePost post;

  const _RoommatePostCard({required this.post});

  String _getPostTypeLabel() {
    switch (post.postType) {
      case RoommatePostType.seeker:
        return 'Looking for place';
      case RoommatePostType.provider:
        return 'Have a place';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => RoommatePostDetailScreen(postId: post.id),
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
            // Image
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              child: Builder(
                builder: (context) {
                  // Debug log
                  debugPrint(
                      '🖼️ RoommatePostCard: post.id=${post.id}, photos count=${post.photos.length}');
                  if (post.photos.isNotEmpty) {
                    debugPrint(
                        '🖼️ RoommatePostCard: first photo URL=${post.photos.first}');
                  }

                  if (post.photos.isEmpty) {
                    return Container(
                      height: 120,
                      color: AppTheme.backgroundColor,
                      child: const Center(
                        child: Icon(Icons.people_outline,
                            size: 40, color: AppTheme.textLightColor),
                      ),
                    );
                  }

                  return Image.network(
                    post.photos.first,
                    height: 120,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 120,
                        color: AppTheme.backgroundColor,
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      debugPrint('❌ Failed to load roommate photo: $error');
                      return Container(
                        height: 120,
                        color: AppTheme.backgroundColor,
                        child: const Center(
                          child: Icon(Icons.broken_image,
                              size: 40, color: AppTheme.textLightColor),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            // Details
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Post type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: post.postType == RoommatePostType.provider
                            ? AppTheme.primaryColor.withValues(alpha: 0.1)
                            : AppTheme.accentColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _getPostTypeLabel(),
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: post.postType == RoommatePostType.provider
                                  ? AppTheme.primaryColor
                                  : AppTheme.accentColor,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      post.title,
                      style: Theme.of(context).textTheme.titleSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      post.city,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    // Budget
                    Text(
                      '${formatVND(post.budgetMin, showCurrency: false)} - ${formatVND(post.budgetMax, showCurrency: false)} VND',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.bold,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
