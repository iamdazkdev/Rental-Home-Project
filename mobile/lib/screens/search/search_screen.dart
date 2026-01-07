import 'package:flutter/material.dart';
import '../../config/app_theme.dart';
import '../../config/app_constants.dart';
import '../../models/listing.dart';
import '../../services/listing_service.dart';
import '../listings/listing_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ListingService _listingService = ListingService();
  final TextEditingController _searchController = TextEditingController();

  List<Listing> _searchResults = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  // Filters
  String? _selectedCategory;
  String? _selectedType;
  double _minPrice = 0;
  double _maxPrice = 10000;
  int _minGuests = 1;
  int _minBedrooms = 0;
  int _minBathrooms = 0;
  List<String> _selectedAmenities = [];

  Future<void> _performSearch() async {
    setState(() {
      _isSearching = true;
      _hasSearched = true;
    });

    final results = await _listingService.searchListings(
      query: _searchController.text.trim(),
      category: _selectedCategory,
      type: _selectedType,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      minGuests: _minGuests,
      minBedrooms: _minBedrooms,
      minBathrooms: _minBathrooms,
      amenities: _selectedAmenities,
    );

    setState(() {
      _searchResults = results;
      _isSearching = false;
    });
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _FilterSheet(
        selectedCategory: _selectedCategory,
        selectedType: _selectedType,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        minGuests: _minGuests,
        minBedrooms: _minBedrooms,
        minBathrooms: _minBathrooms,
        selectedAmenities: _selectedAmenities,
        onApply: (filters) {
          setState(() {
            _selectedCategory = filters['category'];
            _selectedType = filters['type'];
            _minPrice = filters['minPrice'];
            _maxPrice = filters['maxPrice'];
            _minGuests = filters['minGuests'];
            _minBedrooms = filters['minBedrooms'];
            _minBathrooms = filters['minBathrooms'];
            _selectedAmenities = filters['amenities'];
          });
          _performSearch();
        },
        onClear: () {
          setState(() {
            _selectedCategory = null;
            _selectedType = null;
            _minPrice = 0;
            _maxPrice = 10000;
            _minGuests = 1;
            _minBedrooms = 0;
            _minBathrooms = 0;
            _selectedAmenities = [];
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search by location, title...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {});
                              },
                            )
                          : null,
                    ),
                    onSubmitted: (_) => _performSearch(),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  onPressed: _showFilters,
                  icon: const Icon(Icons.tune),
                  style: IconButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),

          // Results
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : !_hasSearched
                    ? _buildInitialState()
                    : _searchResults.isEmpty
                        ? _buildEmptyState()
                        : _buildResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'Start searching',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Find your perfect place',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No results found',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your filters',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildResults() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final listing = _searchResults[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ListingDetailScreen(listingId: listing.id),
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
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: listing.mainPhoto != null
                      ? Image.network(
                          listing.mainPhoto!,
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
                              listing.title,
                              style: Theme.of(context).textTheme.titleMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              listing.shortAddress,
                              style: Theme.of(context).textTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Text(
                              '\$${listing.price.toStringAsFixed(0)}',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppTheme.primaryColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            Text(
                              '/${listing.priceType ?? 'night'}',
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
      },
    );
  }
}

// Filter Bottom Sheet
class _FilterSheet extends StatefulWidget {
  final String? selectedCategory;
  final String? selectedType;
  final double minPrice;
  final double maxPrice;
  final int minGuests;
  final int minBedrooms;
  final int minBathrooms;
  final List<String> selectedAmenities;
  final Function(Map<String, dynamic>) onApply;
  final VoidCallback onClear;

  const _FilterSheet({
    required this.selectedCategory,
    required this.selectedType,
    required this.minPrice,
    required this.maxPrice,
    required this.minGuests,
    required this.minBedrooms,
    required this.minBathrooms,
    required this.selectedAmenities,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late String? _category;
  late String? _type;
  late RangeValues _priceRange;
  late int _guests;
  late int _bedrooms;
  late int _bathrooms;
  late List<String> _amenities;

  @override
  void initState() {
    super.initState();
    _category = widget.selectedCategory;
    _type = widget.selectedType;
    _priceRange = RangeValues(widget.minPrice, widget.maxPrice);
    _guests = widget.minGuests;
    _bedrooms = widget.minBedrooms;
    _bathrooms = widget.minBathrooms;
    _amenities = List.from(widget.selectedAmenities);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    bottom: BorderSide(color: Colors.grey[200]!),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () {
                        widget.onClear();
                        Navigator.pop(context);
                      },
                      child: Text(
                        'Clear all',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Text(
                      'Filters',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                    ),
                    TextButton(
                      onPressed: () {
                        widget.onApply({
                          'category': _category,
                          'type': _type,
                          'minPrice': _priceRange.start,
                          'maxPrice': _priceRange.end,
                          'minGuests': _guests,
                          'minBedrooms': _bedrooms,
                          'minBathrooms': _bathrooms,
                          'amenities': _amenities,
                        });
                        Navigator.pop(context);
                      },
                      child: Text(
                        'Apply',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: Container(
                  color: Colors.grey[50],
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Price Range
                      _buildSectionTitle('Price Range'),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: Column(
                          children: [
                            RangeSlider(
                              values: _priceRange,
                              min: 0,
                              max: 10000,
                              divisions: 100,
                              activeColor: AppTheme.primaryColor,
                              labels: RangeLabels(
                                '\$${_priceRange.start.round()}',
                                '\$${_priceRange.end.round()}',
                              ),
                              onChanged: (values) {
                                setState(() => _priceRange = values);
                              },
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '\$${_priceRange.start.round()}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                                Text(
                                  '\$${_priceRange.end.round()}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryColor,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Category
                      _buildSectionTitle('Category'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: AppConstants.categories.where((cat) => cat != 'All').map((category) {
                          final isSelected = _category == category;
                          return ChoiceChip(
                            label: Text(category),
                            selected: isSelected,
                            selectedColor: AppTheme.primaryColor,
                            backgroundColor: Colors.white,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : Colors.black87,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                            side: BorderSide(
                              color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                            ),
                            onSelected: (selected) {
                              setState(() {
                                _category = selected ? category : null;
                              });
                            },
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 24),

                      // Type
                      _buildSectionTitle('Property Type'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: AppConstants.propertyTypes.map((type) {
                          final isSelected = _type == type;
                          return ChoiceChip(
                            label: Text(type),
                            selected: isSelected,
                            selectedColor: AppTheme.primaryColor,
                            backgroundColor: Colors.white,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : Colors.black87,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                            side: BorderSide(
                              color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                            ),
                            onSelected: (selected) {
                              setState(() {
                                _type = selected ? type : null;
                              });
                            },
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 24),

                      // Counters
                      _buildSectionTitle('Guests & Rooms'),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: Column(
                          children: [
                            _buildCounter('Guests', _guests, (val) => setState(() => _guests = val)),
                            Divider(height: 32, color: Colors.grey[200]),
                            _buildCounter('Bedrooms', _bedrooms, (val) => setState(() => _bedrooms = val)),
                            Divider(height: 32, color: Colors.grey[200]),
                            _buildCounter('Bathrooms', _bathrooms, (val) => setState(() => _bathrooms = val)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Amenities
                      _buildSectionTitle('Amenities'),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: AppConstants.amenities.take(15).map((amenity) {
                          final isSelected = _amenities.contains(amenity);
                          return FilterChip(
                            label: Text(amenity),
                            selected: isSelected,
                            selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                            backgroundColor: Colors.white,
                            checkmarkColor: AppTheme.primaryColor,
                            labelStyle: TextStyle(
                              color: isSelected ? AppTheme.primaryColor : Colors.black87,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            ),
                            side: BorderSide(
                              color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                            ),
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _amenities.add(amenity);
                                } else {
                                  _amenities.remove(amenity);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 80), // Extra space for bottom
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildCounter(String label, int value, Function(int) onChanged) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        Row(
          children: [
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                onPressed: value > 0 ? () => onChanged(value - 1) : null,
                icon: Icon(
                  Icons.remove,
                  color: value > 0 ? AppTheme.primaryColor : Colors.grey[400],
                ),
                constraints: const BoxConstraints(
                  minWidth: 40,
                  minHeight: 40,
                ),
                padding: EdgeInsets.zero,
              ),
            ),
            Container(
              width: 60,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                value.toString(),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                onPressed: () => onChanged(value + 1),
                icon: Icon(
                  Icons.add,
                  color: AppTheme.primaryColor,
                ),
                constraints: const BoxConstraints(
                  minWidth: 40,
                  minHeight: 40,
                ),
                padding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

