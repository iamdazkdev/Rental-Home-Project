import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';
import '../../utils/price_formatter.dart';
import 'roommate_post_detail_screen.dart';
import 'create_roommate_post_screen.dart';

class RoommateSearchScreen extends StatefulWidget {
  const RoommateSearchScreen({super.key});

  @override
  State<RoommateSearchScreen> createState() => _RoommateSearchScreenState();
}

class _RoommateSearchScreenState extends State<RoommateSearchScreen> {
  final RoommateService _roommateService = RoommateService();

  List<RoommatePost> _posts = [];
  bool _isLoading = true;

  String _selectedPostType = 'ALL';
  String _selectedCity = '';

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);

    final posts = await _roommateService.searchPosts(
      postType: _selectedPostType != 'ALL' ? _selectedPostType : null,
      city: _selectedCity.isNotEmpty ? _selectedCity : null,
    );

    // Filter out current user's own posts
    final user = context.read<AuthProvider>().user;
    final filteredPosts = user != null
        ? posts.where((p) => p.userId != user.id).toList()
        : posts;

    setState(() {
      _posts = filteredPosts;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Roommate'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CreateRoommatePostScreen(),
                ),
              ).then((_) => _loadPosts());
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters
          _buildFilters(),

          // Posts List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _posts.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadPosts,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _posts.length,
                          itemBuilder: (context, index) {
                            return _RoommatePostCard(
                              post: _posts[index],
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => RoommatePostDetailScreen(
                                      postId: _posts[index].id,
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Post Type Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('ALL', 'All'),
                const SizedBox(width: 8),
                _buildFilterChip('SEEKER', '🔍 Seekers'),
                const SizedBox(width: 8),
                _buildFilterChip('PROVIDER', '🏠 Providers'),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // City Search
          TextField(
            decoration: InputDecoration(
              hintText: 'Search by city...',
              prefixIcon: const Icon(Icons.location_on_outlined),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            onChanged: (value) {
              _selectedCity = value;
            },
            onSubmitted: (_) => _loadPosts(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedPostType == value;

    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _selectedPostType = value);
        _loadPosts();
      },
      backgroundColor: Colors.grey[100],
      selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primaryColor : Colors.grey[700],
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No roommate posts found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('Try adjusting your filters'),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const CreateRoommatePostScreen(),
                ),
              ).then((_) => _loadPosts());
            },
            icon: const Icon(Icons.add),
            label: const Text('Create a Post'),
          ),
        ],
      ),
    );
  }
}

class _RoommatePostCard extends StatelessWidget {
  final RoommatePost post;
  final VoidCallback onTap;

  const _RoommatePostCard({
    required this.post,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Type badge and date
              Row(
                children: [
                  _buildTypeBadge(),
                  const Spacer(),
                  Text(
                    post.formattedDate,
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                post.title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),

              // Location
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${post.city}, ${post.province}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Budget
              Row(
                children: [
                  const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    '${PriceFormatter.formatPriceInteger(post.budgetMin)} - ${PriceFormatter.formatPriceInteger(post.budgetMax)}/month',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Move-in date
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Move-in: ${post.formattedMoveInDate}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),

              // Lifestyle tags
              if (post.lifestyle.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: post.lifestyle.entries.take(3).map((entry) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _formatLifestyleValue(entry.key, entry.value),
                        style: const TextStyle(fontSize: 11),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeBadge() {
    final isSeeker = post.postType == 'SEEKER';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isSeeker
            ? Colors.blue.withValues(alpha: 0.1)
            : Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSeeker ? Icons.search : Icons.home,
            size: 14,
            color: isSeeker ? Colors.blue : Colors.green,
          ),
          const SizedBox(width: 4),
          Text(
            isSeeker ? 'Looking for room' : 'Has room',
            style: TextStyle(
              color: isSeeker ? Colors.blue : Colors.green,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatLifestyleValue(String key, String value) {
    switch (key) {
      case 'sleepSchedule':
        return value == 'early_bird' ? '🌅 Early Bird' : '🦉 Night Owl';
      case 'smoking':
        return value == 'non_smoker' ? '🚭 Non-Smoker' : '🚬 Smoker';
      case 'cleanliness':
        return value == 'very_clean' ? '✨ Very Clean' : '🧹 Clean';
      default:
        return value;
    }
  }
}

