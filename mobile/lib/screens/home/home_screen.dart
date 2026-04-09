import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';

import '../../config/app_constants.dart';
import '../../config/app_theme.dart';
import '../../core/di/injection.dart';
import '../../features/home/presentation/cubit/home_cubit.dart';
import '../../models/listing.dart';
import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/wishlist_service.dart';
import '../../utils/price_formatter.dart';
import '../listings/listing_detail_screen.dart';
import '../notifications/notifications_screen.dart';
import '../roommate/roommate_post_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<HomeCubit>(
      create: (_) => getIt<HomeCubit>()..loadData(),
      child: const _HomeScreenView(),
    );
  }
}

class _HomeScreenView extends StatelessWidget {
  const _HomeScreenView();

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.home_rounded, color: Theme.of(context).primaryColor),
            const SizedBox(width: 8),
            Text(
              'Rental Home',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, child) {
              final unreadCount = notificationProvider.unreadCount;
              return Stack(
                children: [
                  IconButton(
                    icon: Icon(
                      Icons.notifications_outlined,
                      color: Theme.of(context).iconTheme.color,
                    ),
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
                          color: Theme.of(context).primaryColor,
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
      body: BlocBuilder<HomeCubit, HomeState>(
        builder: (context, state) {
          final cubit = context.read<HomeCubit>();
          final isLoading = state is HomeLoading;
          final currentCategory = cubit.currentCategory;
          final currentType = cubit.currentType;

          return Column(
            children: [
              // Categories
              Container(
                height: 60,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  border: Border(
                    bottom: BorderSide(
                      color: Theme.of(context).dividerColor,
                      width: 1,
                    ),
                  ),
                ),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: AppConstants.categories.length,
                  itemBuilder: (context, index) {
                    final category = AppConstants.categories[index];
                    final isSelected = category == currentCategory;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(category),
                        selected: isSelected,
                        onSelected: (selected) {
                          cubit.setFilter(category, currentType);
                        },
                        backgroundColor: Theme.of(context).colorScheme.surface,
                        selectedColor:
                            Theme.of(context).primaryColor.withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                          color: isSelected
                              ? Theme.of(context).primaryColor
                              : Theme.of(context).textTheme.bodyMedium?.color,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                        side: BorderSide(
                          color: isSelected
                              ? Theme.of(context).primaryColor
                              : Theme.of(context).dividerColor,
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
                  color: Theme.of(context).colorScheme.surface,
                  border: Border(
                    top: BorderSide(color: Theme.of(context).dividerColor, width: 1),
                    bottom: BorderSide(color: Theme.of(context).dividerColor, width: 1),
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
                        selected: currentType == null,
                        onSelected: (selected) {
                          cubit.setFilter(currentCategory, null);
                        },
                        backgroundColor: Theme.of(context).colorScheme.surface,
                        selectedColor:
                            Theme.of(context).primaryColor.withValues(alpha: 0.2),
                        checkmarkColor: Theme.of(context).primaryColor,
                        labelStyle: TextStyle(
                          color: currentType == null
                              ? Theme.of(context).primaryColor
                              : Theme.of(context).textTheme.bodyMedium?.color,
                          fontWeight: currentType == null
                              ? FontWeight.w600
                              : FontWeight.normal,
                          fontSize: 13,
                        ),
                        side: BorderSide(
                          color: currentType == null
                              ? Theme.of(context).primaryColor
                              : Theme.of(context).dividerColor,
                        ),
                      ),
                    ),
                    // Property Types
                    ...AppConstants.propertyTypes.map((type) {
                      final isSelected = type == currentType;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(type),
                          selected: isSelected,
                          onSelected: (selected) {
                            cubit.setFilter(currentCategory, selected ? type : null);
                          },
                          backgroundColor: Theme.of(context).colorScheme.surface,
                          selectedColor:
                              Theme.of(context).primaryColor.withValues(alpha: 0.2),
                          checkmarkColor: Theme.of(context).primaryColor,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Theme.of(context).primaryColor
                                : Theme.of(context).textTheme.bodyMedium?.color,
                            fontWeight:
                                isSelected ? FontWeight.w600 : FontWeight.normal,
                            fontSize: 13,
                          ),
                          side: BorderSide(
                            color: isSelected
                                ? Theme.of(context).primaryColor
                                : Theme.of(context).dividerColor,
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              // Content based on State
              Expanded(
                child: Builder(builder: (context) {
                  if (isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (state is HomeError) {
                    return Center(child: Text(state.message));
                  } else if (state is HomeListingsLoaded) {
                    return _buildListingsGrid(context, state.listings, currentType);
                  } else if (state is HomeRoommatesLoaded) {
                    return _buildRoommatePostsGrid(context, state.posts);
                  }
                  return const SizedBox.shrink();
                }),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildListingsGrid(BuildContext context, List<Listing> listings, String? currentType) {
    if (listings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.home_work_outlined,
              size: 80,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No listings available',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (currentType != null) ...[
              const SizedBox(height: 8),
              Text(
                'Try changing the property type filter',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => context.read<HomeCubit>().loadData(),
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: listings.length,
        itemBuilder: (context, index) {
          final listing = listings[index];
          return _ListingCard(listing: listing);
        },
      ),
    );
  }

  Widget _buildRoommatePostsGrid(BuildContext context, List<RoommatePost> posts) {
    if (posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 80,
              color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No roommate posts available',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Be the first to create a roommate post!',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => context.read<HomeCubit>().loadData(),
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: posts.length,
        itemBuilder: (context, index) {
          final post = posts[index];
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
      setState(() { _isInWishlist = !_isInWishlist; });
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
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ListingDetailScreen(listingId: widget.listing.id))),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
          color: Theme.of(context).cardColor,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                          errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                        )
                      : _buildPlaceholder(),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: _toggleWishlist,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: _isToggling
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : Icon(
                                _isInWishlist ? Icons.favorite : Icons.favorite_border,
                                color: _isInWishlist ? Theme.of(context).primaryColor : Theme.of(context).iconTheme.color,
                                size: 20,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
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
                        Text(widget.listing.title, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Text(widget.listing.shortAddress, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            formatVND(widget.listing.price, showCurrency: false),
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(' VND/${widget.listing.priceType ?? 'night'}', style: Theme.of(context).textTheme.bodySmall),
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

  Widget _buildPlaceholder() {
    return Container(
      height: 120,
      color: Theme.of(context).colorScheme.surface,
      child: Icon(Icons.home_work_outlined, size: 40, color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.3)),
    );
  }
}

class _RoommatePostCard extends StatelessWidget {
  final RoommatePost post;
  const _RoommatePostCard({required this.post});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RoommatePostDetailScreen(postId: post.id))),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
          color: Theme.of(context).cardColor,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              child: Builder(builder: (context) {
                if (post.photos.isEmpty) {
                  return Container(
                    height: 120,
                    color: Theme.of(context).colorScheme.surface,
                    child: Center(child: Icon(Icons.people_outline, size: 40, color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.3))),
                  );
                }
                return Image.network(
                  post.photos.first,
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 120,
                    color: Theme.of(context).colorScheme.surface,
                    child: Center(child: Icon(Icons.broken_image, size: 40, color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.3))),
                  ),
                );
              }),
            ),
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
                        Text(post.title, style: Theme.of(context).textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined, size: 14, color: Theme.of(context).iconTheme.color),
                            const SizedBox(width: 4),
                            Expanded(child: Text(post.locationString, style: Theme.of(context).textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis)),
                          ],
                        ),
                      ],
                    ),
                    Text(
                      '${formatVND(post.budgetMin, showCurrency: false)} - ${formatVND(post.budgetMax, showCurrency: true)}',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
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
