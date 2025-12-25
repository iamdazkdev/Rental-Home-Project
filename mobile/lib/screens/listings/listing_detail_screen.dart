import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart' as carousel;
import '../../models/listing.dart';
import '../../models/review.dart';
import '../../models/conversation.dart';
import '../../services/listing_service.dart';
import '../../services/review_service.dart';
import '../../providers/auth_provider.dart';
import '../../config/app_theme.dart';
import '../../utils/price_formatter.dart';
import '../../utils/amenity_icons.dart';
import '../bookings/create_booking_screen.dart';
import '../host/host_profile_screen.dart';
import '../messages/messages_screen.dart';

class ListingDetailScreen extends StatefulWidget {
  final String listingId;

  const ListingDetailScreen({
    super.key,
    required this.listingId,
  });

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  final ListingService _listingService = ListingService();
  final ReviewService _reviewService = ReviewService();
  Listing? _listing;
  bool _isLoading = true;
  int _currentImageIndex = 0;
  List<Review> _listingReviews = [];
  double _averageRating = 0.0;

  @override
  void initState() {
    super.initState();
    _loadListingDetails();
  }

  Future<void> _loadListingDetails() async {
    setState(() => _isLoading = true);

    final listing = await _listingService.getListingDetails(widget.listingId);

    // Fetch listing reviews
    List<Review> reviews = [];
    double avgRating = 0.0;

    if (listing != null) {
      reviews = await _reviewService.getListingReviews(widget.listingId);
      if (reviews.isNotEmpty) {
        final ratings = reviews.map((r) => r.homeRating).where((r) => r > 0);
        if (ratings.isNotEmpty) {
          avgRating = ratings.reduce((a, b) => a + b) / ratings.length;
        }
      }
    }

    setState(() {
      _listing = listing;
      _listingReviews = reviews;
      _averageRating = avgRating;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_listing == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Listing Not Found')),
        body: const Center(
          child: Text('This listing could not be found.'),
        ),
      );
    }

    final isOwnListing = user?.id == _listing!.creator;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Image Carousel
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  carousel.CarouselSlider(
                    options: carousel.CarouselOptions(
                      height: 300,
                      viewportFraction: 1.0,
                      onPageChanged: (index, reason) {
                        setState(() => _currentImageIndex = index);
                      },
                    ),
                    items: _listing!.photoUrls.map((url) {
                      return CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        placeholder: (context, url) => Container(
                          color: AppTheme.backgroundColor,
                          child: const Center(
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: AppTheme.backgroundColor,
                          child: const Icon(Icons.home_work_outlined, size: 60),
                        ),
                      );
                    }).toList(),
                  ),
                  // Image indicator
                  Positioned(
                    bottom: 16,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: _listing!.photoUrls.asMap().entries.map((entry) {
                        return Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentImageIndex == entry.key
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.4),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _listing!.title,
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _listing!.shortAddress,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            PriceFormatter.formatPriceInteger(_listing!.price),
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  color: AppTheme.primaryColor,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            '/${_listing!.priceType ?? 'night'}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ],
                  ),

                  const Divider(height: 32),

                  // Property Stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatItem(Icons.people_outline, '${_listing!.guestCount} guests'),
                      _buildStatItem(Icons.bed_outlined, '${_listing!.bedroomCount} bedrooms'),
                      _buildStatItem(Icons.bathtub_outlined, '${_listing!.bathroomCount} bathrooms'),
                    ],
                  ),

                  const Divider(height: 32),

                  // Category and Type
                  Text(
                    'Property Type',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_listing!.category} • ${_listing!.type}',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),

                  const SizedBox(height: 24),

                  // Description
                  Text(
                    'About this place',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _listing!.description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),

                  const SizedBox(height: 24),

                  // Highlight
                  if (_listing!.highlight.isNotEmpty) ...[
                    Text(
                      _listing!.highlight,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.primaryColor,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _listing!.highlightDesc,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Host Section
                  _buildHostSection(),
                  const SizedBox(height: 24),

                  // Host Bio and Profile (for Room/Shared Room only)
                  if (_listing!.type == 'Room(s)' || _listing!.type == 'A Shared Room') ...[
                    _buildHostBioAndProfile(),
                    const SizedBox(height: 24),
                  ],

                  // Listing Rating
                  if (_listingReviews.isNotEmpty) ...[
                    _buildRatingSection(),
                    const SizedBox(height: 24),
                  ],

                  // Amenities
                  Text(
                    'Amenities',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 3.5,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _listing!.amenities.length,
                    itemBuilder: (context, index) {
                      final amenity = _listing!.amenities[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundColor,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              AmenityIcons.getIcon(amenity),
                              size: 20,
                              color: AmenityIcons.getColor(amenity),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                amenity,
                                style: Theme.of(context).textTheme.bodyMedium,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 100), // Space for button
                ],
              ),
            ),
          ),
        ],
      ),

      // Action Buttons (only if not own listing)
      bottomNavigationBar: !isOwnListing
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Contact Host Button
                  Expanded(
                    flex: 2,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // Get host name from creator data
                        final firstName = _listing!.creatorData?['firstName'] ?? '';
                        final lastName = _listing!.creatorData?['lastName'] ?? '';

                        // Sort user IDs to match backend conversation ID generation
                        final userId = user!.id;
                        final hostId = _listing!.creator;
                        final sortedIds = [userId, hostId]..sort();

                        // Generate conversation ID matching backend logic
                        final conversationId = _listing!.id.isNotEmpty
                            ? 'temp_${sortedIds[0]}_${sortedIds[1]}_${_listing!.id}'
                            : 'temp_${sortedIds[0]}_${sortedIds[1]}';

                        // Create temporary conversation for contact host
                        final tempConversation = Conversation(
                          conversationId: conversationId,
                          otherUser: {
                            '_id': _listing!.creator,
                            'firstName': firstName,
                            'lastName': lastName,
                            'profileImagePath': _listing!.creatorData?['profileImagePath'],
                          },
                          listing: {
                            '_id': _listing!.id,
                            'title': _listing!.title,
                            'listingPhotoPaths': _listing!.listingPhotoPaths,
                          },
                          lastMessage: 'Start a conversation...',
                          lastMessageAt: DateTime.now(),
                          unreadCount: 0,
                        );

                        // Navigate to chat screen
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ChatScreen(conversation: tempConversation),
                          ),
                        );
                      },
                      icon: const Icon(Icons.chat_bubble_outline),
                      label: const Text('Contact Host'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: AppTheme.primaryColor),
                        foregroundColor: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Book Now Button
                  Expanded(
                    flex: 3,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CreateBookingScreen(listing: _listing!),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Book Now'),
                    ),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  Widget _buildStatItem(IconData icon, String label) {
    return Column(
      children: [
        Icon(icon, size: 28, color: AppTheme.primaryColor),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }

  Widget _buildHostSection() {
    return InkWell(
      onTap: () {
        // Navigate to host profile screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => HostProfileScreen(hostId: _listing!.creator),
          ),
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Row(
          children: [
            // Host Avatar
            CircleAvatar(
              radius: 30,
              backgroundColor: AppTheme.primaryColor,
              backgroundImage: _listing!.hostProfileImage != null
                  ? CachedNetworkImageProvider(_listing!.hostProfileImage!)
                  : null,
              child: _listing!.hostProfileImage == null
                  ? Text(
                      _listing!.hostInitial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hosted by ${_listing!.hostName}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_listing!.type} • ${_listing!.city}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textSecondaryColor,
                        ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppTheme.textSecondaryColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHostBioAndProfile() {
    final creatorData = _listing!.creatorData;
    final hostProfile = _listing!.hostProfile;
    final hostBio = creatorData?['hostBio'] as String?;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.backgroundColor,
            Colors.white,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.person_outline, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              Text(
                'About Your Host',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Host Bio Section
          if (hostBio != null && hostBio.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryColor.withValues(alpha: 0.1),
                    Colors.white,
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryColor, width: 2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.edit_note, color: AppTheme.primaryColor, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'About Me',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    hostBio,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          height: 1.6,
                          color: AppTheme.textPrimaryColor,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Host Profile Details
          if (hostProfile != null) ...[
            // Profile Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: [
                _buildProfileItem(
                  '🌙',
                  'Sleep Schedule',
                  _formatSleepSchedule(hostProfile['sleepSchedule']),
                ),
                _buildProfileItem(
                  '🚬',
                  'Smoking',
                  _formatSmoking(hostProfile['smoking']),
                ),
                _buildProfileItem(
                  '😊',
                  'Personality',
                  _formatPersonality(hostProfile['personality']),
                ),
                _buildProfileItem(
                  '🧹',
                  'Cleanliness',
                  _formatCleanliness(hostProfile['cleanliness']),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Occupation
            if (hostProfile['occupation'] != null && (hostProfile['occupation'] as String).isNotEmpty)
              _buildProfileSection('💼 Occupation', hostProfile['occupation']),

            // Hobbies
            if (hostProfile['hobbies'] != null && (hostProfile['hobbies'] as String).isNotEmpty)
              _buildProfileSection('🎨 Hobbies & Interests', hostProfile['hobbies']),

            // House Rules
            if (hostProfile['houseRules'] != null && (hostProfile['houseRules'] as String).isNotEmpty)
              _buildProfileSection('📋 House Rules', hostProfile['houseRules']),

            // Additional Info
            if (hostProfile['additionalInfo'] != null && (hostProfile['additionalInfo'] as String).isNotEmpty)
              _buildProfileSection('💬 Additional Information', hostProfile['additionalInfo']),
          ],
        ],
      ),
    );
  }

  Widget _buildProfileItem(String emoji, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.textPrimaryColor,
                  fontWeight: FontWeight.bold,
                ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSection(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.textSecondaryColor,
                  height: 1.5,
                ),
          ),
        ],
      ),
    );
  }

  String _formatSleepSchedule(dynamic value) {
    if (value == 'early_bird') return 'Early Bird';
    if (value == 'night_owl') return 'Night Owl';
    if (value == 'flexible') return 'Flexible';
    return value?.toString() ?? 'N/A';
  }

  String _formatSmoking(dynamic value) {
    if (value == 'no') return 'Non-smoker';
    if (value == 'outside_only') return 'Outside only';
    if (value == 'yes') return 'Smoker';
    return value?.toString() ?? 'N/A';
  }

  String _formatPersonality(dynamic value) {
    if (value == 'introvert') return 'Introvert';
    if (value == 'extrovert') return 'Extrovert';
    if (value == 'ambivert') return 'Ambivert';
    return value?.toString() ?? 'N/A';
  }

  String _formatCleanliness(dynamic value) {
    if (value == 'very_clean') return 'Very Clean';
    if (value == 'moderate') return 'Moderate';
    if (value == 'relaxed') return 'Relaxed';
    return value?.toString() ?? 'N/A';
  }

  Widget _buildRatingSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.amber.withValues(alpha: 0.1),
            Colors.amber.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          // Rating Stars
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.white, size: 20),
                    const SizedBox(width: 4),
                    Text(
                      _averageRating.toStringAsFixed(1),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Guest Reviews',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    ...List.generate(5, (index) {
                      return Icon(
                        index < _averageRating.round()
                            ? Icons.star
                            : Icons.star_border,
                        color: Colors.amber,
                        size: 16,
                      );
                    }),
                    const SizedBox(width: 8),
                    Text(
                      '${_listingReviews.length} review${_listingReviews.length != 1 ? 's' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textSecondaryColor,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

