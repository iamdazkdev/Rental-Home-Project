import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../services/listing_service.dart';

class EditPropertyScreen extends StatefulWidget {
  final String propertyId;

  const EditPropertyScreen({super.key, required this.propertyId});

  @override
  State<EditPropertyScreen> createState() => _EditPropertyScreenState();
}

class _EditPropertyScreenState extends State<EditPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final ListingService _listingService = ListingService();

  bool _isLoading = true;
  bool _isSaving = false;

  // Form controllers
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _priceController;
  late TextEditingController _streetAddressController;
  late TextEditingController _aptSuiteController;
  late TextEditingController _cityController;
  late TextEditingController _provinceController;
  late TextEditingController _countryController;

  // Property type
  String _propertyType = 'Entire Place';
  final List<String> _propertyTypes = ['Entire Place', 'Room(s)'];

  // Property details
  int _bedroomCount = 1;
  int _bedCount = 1;
  int _bathroomCount = 1;
  int _guestCount = 1;

  // Amenities
  final List<String> _selectedAmenities = [];
  final List<String> _availableAmenities = [
    'Wifi',
    'TV',
    'Kitchen',
    'Washing Machine',
    'Air Conditioning',
    'Heating',
    'Parking',
    'Refrigerator',
    'Microwave',
    'Pool',
    'Gym',
    'Security',
  ];

  @override
  void initState() {
    super.initState();
    _initControllers();
    _loadPropertyData();
  }

  void _initControllers() {
    _titleController = TextEditingController();
    _descriptionController = TextEditingController();
    _priceController = TextEditingController();
    _streetAddressController = TextEditingController();
    _aptSuiteController = TextEditingController();
    _cityController = TextEditingController();
    _provinceController = TextEditingController();
    _countryController = TextEditingController();
  }

  Future<void> _loadPropertyData() async {
    setState(() => _isLoading = true);

    try {
      final property =
          await _listingService.getListingDetails(widget.propertyId);

      if (property != null && mounted) {
        setState(() {
          _titleController.text = property.title;
          _descriptionController.text = property.description;
          _priceController.text = property.price.toInt().toString();
          _streetAddressController.text = property.streetAddress;
          _aptSuiteController.text = property.aptSuite;
          _cityController.text = property.city;
          _provinceController.text = property.province;
          _countryController.text = property.country;
          _propertyType = property.type;
          _bedroomCount = property.bedroomCount;
          _bedCount = property.bedCount;
          _bathroomCount = property.bathroomCount;
          _guestCount = property.guestCount;
          _selectedAmenities.addAll(property.amenities);
        });
      }
    } catch (e) {
      debugPrint('Error loading property: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to load property details'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveChanges() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      // TODO: Implement API call to update listing
      // final result = await _listingService.updateListing(...);

      await Future.delayed(const Duration(seconds: 1)); // Simulate API call

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Property updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      debugPrint('Error updating property: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update property: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _streetAddressController.dispose();
    _aptSuiteController.dispose();
    _cityController.dispose();
    _provinceController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Edit Entire Place Listing',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        elevation: 0,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor,
                AppTheme.primaryColor.withValues(alpha: 0.8)
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        actions: [
          if (!_isLoading)
            TextButton.icon(
              onPressed: _isSaving ? null : _saveChanges,
              icon: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.save, color: Colors.white),
              label: Text(
                _isSaving ? 'Saving...' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionTitle('Basic Information'),
                    _buildTextField(
                      controller: _titleController,
                      label: 'Property Title',
                      hint: 'e.g., Beautiful 2BR Apartment',
                      icon: Icons.title,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a title';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'Description',
                      hint: 'Describe your property...',
                      icon: Icons.description,
                      maxLines: 5,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a description';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildPropertyTypeSelector(),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _priceController,
                      label: _propertyType == 'Room(s)'
                          ? 'Monthly Price (VND)'
                          : 'Nightly Price (VND)',
                      hint: _propertyType == 'Room(s)' ? '5000000' : '500000',
                      icon: Icons.attach_money,
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a price';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSectionTitle('Property Details'),
                    _buildCounterRow('Bedrooms', _bedroomCount, (val) {
                      setState(() => _bedroomCount = val);
                    }),
                    _buildCounterRow('Beds', _bedCount, (val) {
                      setState(() => _bedCount = val);
                    }),
                    _buildCounterRow('Bathrooms', _bathroomCount, (val) {
                      setState(() => _bathroomCount = val);
                    }),
                    _buildCounterRow('Max Guests', _guestCount, (val) {
                      setState(() => _guestCount = val);
                    }),
                    const SizedBox(height: 24),
                    _buildSectionTitle('Location'),
                    _buildTextField(
                      controller: _streetAddressController,
                      label: 'Street Address',
                      hint: '123 Main Street',
                      icon: Icons.location_on,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter street address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _aptSuiteController,
                      label: 'Apt/Suite (Optional)',
                      hint: 'Apt 4B',
                      icon: Icons.apartment,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _cityController,
                            label: 'City',
                            hint: 'Ho Chi Minh',
                            icon: Icons.location_city,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildTextField(
                            controller: _provinceController,
                            label: 'Province',
                            hint: 'HCM',
                            icon: Icons.map,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _countryController,
                      label: 'Country',
                      hint: 'Vietnam',
                      icon: Icons.flag,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter country';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    _buildSectionTitle('Amenities'),
                    _buildAmenitiesSection(),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildPropertyTypeSelector() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.home, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              const Text(
                'Property Type',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: _propertyTypes.map((type) {
              return ButtonSegment<String>(
                value: type,
                label: Text(type),
                icon: Icon(
                  type == 'Entire Place' ? Icons.home : Icons.meeting_room,
                ),
              );
            }).toList(),
            selected: {_propertyType},
            onSelectionChanged: (Set<String> newSelection) {
              setState(() {
                _propertyType = newSelection.first;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: AppTheme.primaryColor),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primaryColor, width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }

  Widget _buildCounterRow(String label, int value, Function(int) onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.black87,
            ),
          ),
          Row(
            children: [
              IconButton(
                onPressed: value > 1 ? () => onChanged(value - 1) : null,
                icon: const Icon(Icons.remove_circle_outline),
                color: value > 1 ? AppTheme.primaryColor : Colors.grey,
              ),
              Container(
                width: 40,
                alignment: Alignment.center,
                child: Text(
                  value.toString(),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: value < 20 ? () => onChanged(value + 1) : null,
                icon: const Icon(Icons.add_circle_outline),
                color: value < 20 ? AppTheme.primaryColor : Colors.grey,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesSection() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _availableAmenities.map((amenity) {
        final isSelected = _selectedAmenities.contains(amenity);
        return FilterChip(
          label: Text(amenity),
          selected: isSelected,
          onSelected: (selected) {
            setState(() {
              if (selected) {
                _selectedAmenities.add(amenity);
              } else {
                _selectedAmenities.remove(amenity);
              }
            });
          },
          selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
          checkmarkColor: AppTheme.primaryColor,
          labelStyle: TextStyle(
            color: isSelected ? AppTheme.primaryColor : Colors.black87,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
          side: BorderSide(
            color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        );
      }).toList(),
    );
  }
}
