import 'package:flutter/material.dart';

import '../room_rental/room_rental_search_screen.dart';
import '../roommate/roommate_search_screen.dart';
import '../search/search_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Theme.of(context).primaryColor,
          unselectedLabelColor: Theme.of(context).textTheme.bodySmall?.color,
          indicatorColor: Theme.of(context).primaryColor,
          tabs: const [
            Tab(
              icon: Icon(Icons.home_outlined),
              text: 'Entire Place',
            ),
            Tab(
              icon: Icon(Icons.meeting_room_outlined),
              text: 'Rooms',
            ),
            Tab(
              icon: Icon(Icons.people_outline),
              text: 'Roommate',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          // Entire Place Search
          SearchScreen(),

          // Room Rental Search
          RoomRentalSearchScreen(),

          // Roommate Search
          RoommateSearchScreen(),
        ],
      ),
    );
  }
}
