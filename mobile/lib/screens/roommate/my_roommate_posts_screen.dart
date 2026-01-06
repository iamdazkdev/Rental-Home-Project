import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';
import '../../utils/price_formatter.dart';
import 'roommate_post_detail_screen.dart';
import 'create_roommate_post_screen.dart';

class MyRoommatePostsScreen extends StatefulWidget {
  const MyRoommatePostsScreen({super.key});

  @override
  State<MyRoommatePostsScreen> createState() => _MyRoommatePostsScreenState();
}

class _MyRoommatePostsScreenState extends State<MyRoommatePostsScreen> {
  final RoommateService _roommateService = RoommateService();

  List<RoommatePost> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isLoading = true);

    final posts = await _roommateService.getMyPosts(user.id);

    setState(() {
      _posts = posts;
      _isLoading = false;
    });
  }

  Future<void> _closePost(String postId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close Post?'),
        content: const Text(
          'Are you sure you want to close this post? It will no longer be visible to others.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Close Post'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final result = await _roommateService.closePost(postId);

    if (result['success']) {
      _loadPosts();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Post closed successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to close post')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Roommate Posts'),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _posts.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadPosts,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _posts.length,
                    itemBuilder: (context, index) {
                      return _PostCard(
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
                        onClose: () => _closePost(_posts[index].id),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const CreateRoommatePostScreen(),
            ),
          ).then((_) => _loadPosts());
        },
        icon: const Icon(Icons.add),
        label: const Text('New Post'),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.article_outlined, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text(
              'No posts yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Create a post to find your perfect roommate',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
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
              label: const Text('Create Post'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final RoommatePost post;
  final VoidCallback onTap;
  final VoidCallback onClose;

  const _PostCard({
    required this.post,
    required this.onTap,
    required this.onClose,
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
              // Header
              Row(
                children: [
                  _buildTypeBadge(),
                  const SizedBox(width: 8),
                  _buildStatusBadge(),
                  const Spacer(),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'close') onClose();
                    },
                    itemBuilder: (context) => [
                      if (post.status.value == 'ACTIVE')
                        const PopupMenuItem(
                          value: 'close',
                          child: Row(
                            children: [
                              Icon(Icons.close, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Close Post'),
                            ],
                          ),
                        ),
                    ],
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

              // Date
              Row(
                children: [
                  const Icon(Icons.access_time, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Created: ${post.formattedDate}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeBadge() {
    final isSeeker = post.postType.value == 'SEEKER';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isSeeker
            ? Colors.blue.withValues(alpha: 0.1)
            : Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        isSeeker ? '🔍 Seeker' : '🏠 Provider',
        style: TextStyle(
          color: isSeeker ? Colors.blue : Colors.green,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    String text;

    switch (post.status.value) {
      case 'ACTIVE':
        color = AppTheme.successColor;
        text = 'Active';
        break;
      case 'MATCHED':
        color = Colors.orange;
        text = 'Matched';
        break;
      case 'CLOSED':
        color = Colors.grey;
        text = 'Closed';
        break;
      default:
        color = Colors.grey;
        text = post.status.value;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

