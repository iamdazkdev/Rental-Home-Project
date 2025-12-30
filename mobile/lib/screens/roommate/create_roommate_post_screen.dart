import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/roommate_service.dart';
import '../../services/identity_verification_service.dart';

class CreateRoommatePostScreen extends StatefulWidget {
  const CreateRoommatePostScreen({super.key});

  @override
  State<CreateRoommatePostScreen> createState() => _CreateRoommatePostScreenState();
}

class _CreateRoommatePostScreenState extends State<CreateRoommatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final RoommateService _roommateService = RoommateService();
  final IdentityVerificationService _verificationService = IdentityVerificationService();

  int _currentStep = 0;
  bool _isSubmitting = false;
  bool _isCheckingVerification = true;
  bool _isVerified = false;

  // Form data
  String _postType = 'SEEKER';
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _cityController = TextEditingController();
  final _provinceController = TextEditingController();
  final _budgetMinController = TextEditingController();
  final _budgetMaxController = TextEditingController();
  DateTime _moveInDate = DateTime.now().add(const Duration(days: 30));

  String _genderPreference = 'ANY';
  final _ageMinController = TextEditingController(text: '18');
  final _ageMaxController = TextEditingController(text: '50');

  // Lifestyle
  String _sleepSchedule = 'flexible';
  String _smoking = 'non_smoker';
  String _cleanliness = 'moderate';
  String _personality = 'ambivert';

  // Contact
  String _preferredContact = 'CHAT';
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _checkVerification();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    _provinceController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _ageMinController.dispose();
    _ageMaxController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _checkVerification() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      Navigator.pop(context);
      return;
    }

    final result = await _verificationService.checkStatus(user.id);

    setState(() {
      _isCheckingVerification = false;
      _isVerified = result['status'] == 'approved';
    });

    if (!_isVerified) {
      _showVerificationRequired();
    }
  }

  void _showVerificationRequired() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.verified_user, color: AppTheme.warningColor),
            SizedBox(width: 12),
            Text('Verification Required'),
          ],
        ),
        content: const Text(
          'To create a roommate post, you need to verify your identity first. This helps keep our community safe.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/identity-verification');
            },
            child: const Text('Verify Now'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitPost() async {
    if (!_formKey.currentState!.validate()) return;

    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    setState(() => _isSubmitting = true);

    final result = await _roommateService.createPost(
      userId: user.id,
      postType: _postType,
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      city: _cityController.text.trim(),
      province: _provinceController.text.trim(),
      country: 'Vietnam',
      budgetMin: double.tryParse(_budgetMinController.text) ?? 0,
      budgetMax: double.tryParse(_budgetMaxController.text) ?? 0,
      moveInDate: _moveInDate,
      genderPreference: _genderPreference,
      ageRangeMin: int.tryParse(_ageMinController.text),
      ageRangeMax: int.tryParse(_ageMaxController.text),
      lifestyle: {
        'sleepSchedule': _sleepSchedule,
        'smoking': _smoking,
        'cleanliness': _cleanliness,
        'personality': _personality,
      },
      preferredContact: _preferredContact,
      phoneNumber: _phoneController.text.trim(),
      emailAddress: _emailController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (result['success']) {
      _showSuccessDialog();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to create post')),
      );
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: AppTheme.successColor, size: 32),
            SizedBox(width: 12),
            Text('Post Created!'),
          ],
        ),
        content: const Text(
          'Your roommate post has been created successfully. Others can now find and contact you.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingVerification) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create Roommate Post')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (!_isVerified) {
      return Scaffold(
        appBar: AppBar(title: const Text('Create Roommate Post')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.verified_user, size: 80, color: Colors.grey),
                const SizedBox(height: 16),
                const Text(
                  'Verification Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please verify your identity to create roommate posts.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, '/identity-verification');
                  },
                  child: const Text('Verify Now'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Roommate Post'),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep < 3) {
              setState(() => _currentStep++);
            } else {
              _submitPost();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            }
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Row(
                children: [
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : details.onStepContinue,
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(_currentStep == 3 ? 'Create Post' : 'Continue'),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    TextButton(
                      onPressed: details.onStepCancel,
                      child: const Text('Back'),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            // Step 1: Basic Info
            Step(
              title: const Text('Basic Info'),
              isActive: _currentStep >= 0,
              content: Column(
                children: [
                  // Post Type
                  const Text(
                    'What are you looking for?',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTypeOption(
                          'SEEKER',
                          '🔍 Looking for Room',
                          'I need a place to stay',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildTypeOption(
                          'PROVIDER',
                          '🏠 Has Room',
                          'I have a room available',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                      hintText: 'e.g., Looking for roommate in District 1',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Tell about yourself and what you are looking for...',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                ],
              ),
            ),

            // Step 2: Location & Budget
            Step(
              title: const Text('Location & Budget'),
              isActive: _currentStep >= 1,
              content: Column(
                children: [
                  TextFormField(
                    controller: _cityController,
                    decoration: const InputDecoration(
                      labelText: 'City/District',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _provinceController,
                    decoration: const InputDecoration(
                      labelText: 'Province',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v?.isEmpty == true ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _budgetMinController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Min Budget (VND)',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _budgetMaxController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Max Budget (VND)',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today),
                    title: const Text('Move-in Date'),
                    subtitle: Text(_formatDate(_moveInDate)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: _moveInDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null) {
                        setState(() => _moveInDate = date);
                      }
                    },
                  ),
                ],
              ),
            ),

            // Step 3: Preferences
            Step(
              title: const Text('Preferences'),
              isActive: _currentStep >= 2,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Gender Preference'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ['ANY', 'MALE', 'FEMALE'].map((g) {
                      return ChoiceChip(
                        label: Text(g),
                        selected: _genderPreference == g,
                        onSelected: (s) => setState(() => _genderPreference = g),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  const Text('Lifestyle'),
                  const SizedBox(height: 8),
                  _buildLifestyleDropdown(
                    'Sleep Schedule',
                    _sleepSchedule,
                    ['early_bird', 'night_owl', 'flexible'],
                    (v) => setState(() => _sleepSchedule = v!),
                  ),
                  _buildLifestyleDropdown(
                    'Smoking',
                    _smoking,
                    ['non_smoker', 'smoker', 'outdoor_only'],
                    (v) => setState(() => _smoking = v!),
                  ),
                  _buildLifestyleDropdown(
                    'Cleanliness',
                    _cleanliness,
                    ['very_clean', 'moderate', 'relaxed'],
                    (v) => setState(() => _cleanliness = v!),
                  ),
                ],
              ),
            ),

            // Step 4: Contact
            Step(
              title: const Text('Contact'),
              isActive: _currentStep >= 3,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Preferred Contact Method'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: ['CHAT', 'PHONE', 'EMAIL'].map((c) {
                      return ChoiceChip(
                        label: Text(c),
                        selected: _preferredContact == c,
                        onSelected: (s) => setState(() => _preferredContact = c),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  if (_preferredContact == 'PHONE')
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  if (_preferredContact == 'EMAIL')
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email Address',
                        border: OutlineInputBorder(),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeOption(String type, String title, String subtitle) {
    final isSelected = _postType == type;

    return GestureDetector(
      onTap: () => setState(() => _postType = type),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? AppTheme.primaryColor.withValues(alpha: 0.05) : null,
        ),
        child: Column(
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLifestyleDropdown(
    String label,
    String value,
    List<String> options,
    ValueChanged<String?> onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
        ),
        items: options.map((o) {
          return DropdownMenuItem(
            value: o,
            child: Text(_formatOption(o)),
          );
        }).toList(),
        onChanged: onChanged,
      ),
    );
  }

  String _formatOption(String option) {
    return option.replaceAll('_', ' ').split(' ').map((w) {
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

