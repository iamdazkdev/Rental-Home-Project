import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/roommate.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';
import '../../utils/price_formatter.dart';
import 'create_roommate_post_screen.dart';
import 'roommate_post_detail_screen.dart';

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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Post closed successfully')),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to close post')),
      );
    }
  }

  Future<void> _activatePost(String postId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Activate Post?'),
        content: const Text(
          'Do you want to reopen this post? It will be visible to others again.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Activate'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final result = await _roommateService.activatePost(postId);

    if (result['success']) {
      _loadPosts();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post activated successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to activate post')),
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
                        onActivate: () => _activatePost(_posts[index].id),
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
            Icon(Icons.article_outlined,
                size: 80,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            const Text(
              'No posts yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Create a post to find your perfect roommate',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
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
  final VoidCallback onActivate;

  const _PostCard({
    required this.post,
    required this.onTap,
    required this.onClose,
    required this.onActivate,
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
                      if (value == 'close') {
                        onClose();
                      } else if (value == 'activate') {
                        onActivate();
                      }
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
                      if (post.status.value == 'CLOSED')
                        const PopupMenuItem(
                          value: 'activate',
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green),
                              SizedBox(width: 8),
                              Text('Activate Post'),
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
                  Icon(Icons.location_on,
                      size: 16,
                      color: Theme.of(context)
                          .iconTheme
                          .color
                          ?.withValues(alpha: 0.6)),
                  const SizedBox(width: 4),
                  Text(
                    '${post.city}, ${post.province}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Budget
              Row(
                children: [
                  Icon(Icons.attach_money,
                      size: 16,
                      color: Theme.of(context)
                          .iconTheme
                          .color
                          ?.withValues(alpha: 0.6)),
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
                  Icon(Icons.access_time,
                      size: 16,
                      color: Theme.of(context)
                          .iconTheme
                          .color
                          ?.withValues(alpha: 0.6)),
                  const SizedBox(width: 4),
                  Text(
                    'Created: ${post.formattedDate}',
                    style: Theme.of(context).textTheme.bodySmall,
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
        color = Colors.green;
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
