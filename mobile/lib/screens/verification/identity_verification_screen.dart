import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../services/identity_verification_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/loading_overlay.dart';

class IdentityVerificationScreen extends StatefulWidget {
  final bool isRequired;
  final VoidCallback? onVerificationComplete;

  const IdentityVerificationScreen({
    super.key,
    this.isRequired = false,
    this.onVerificationComplete,
  });

  @override
  State<IdentityVerificationScreen> createState() =>
      _IdentityVerificationScreenState();
}

class _IdentityVerificationScreenState
    extends State<IdentityVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _identityVerificationService = IdentityVerificationService();
  final _storageService = StorageService();
  final _imagePicker = ImagePicker();

  bool _isLoading = false;
  DateTime? _selectedDate;
  File? _idCardFront;
  File? _idCardBack;
  Map<String, dynamic>? _existingVerification;

  @override
  void initState() {
    super.initState();
    _checkExistingVerification();
  }

  Future<void> _checkExistingVerification() async {
    setState(() => _isLoading = true);
    try {
      final user = await _storageService.getUser();
      if (user != null) {
        final result =
            await _identityVerificationService.getVerificationStatus(user.id);

        if (result['exists'] == true) {
          setState(() {
            _existingVerification = result;
            if (result['verification'] != null) {
              final verification = result['verification'];
              _fullNameController.text = verification['fullName'] ?? '';
              _phoneController.text = verification['phoneNumber'] ?? '';
              if (verification['dateOfBirth'] != null) {
                _selectedDate = DateTime.parse(verification['dateOfBirth']);
              }
            }
          });
        }
      }
    } catch (e) {
      debugPrint('Error checking verification: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickImage(bool isFront) async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          if (isFront) {
            _idCardFront = File(image.path);
          } else {
            _idCardBack = File(image.path);
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to pick image: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().subtract(const Duration(days: 6570)),
      // 18 years ago
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFFF385C),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitVerification() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select your date of birth'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_idCardFront == null || _idCardBack == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload both sides of your ID card'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = await _storageService.getUser();
      if (user == null) {
        throw Exception('User not found');
      }

      final result = await _identityVerificationService.submitVerification(
        userId: user.id,
        fullName: _fullNameController.text,
        phoneNumber: _phoneController.text,
        dateOfBirth: _selectedDate!,
        idCardFront: _idCardFront!,
        idCardBack: _idCardBack!,
      );

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Identity verification submitted successfully!'),
              backgroundColor: Colors.green,
            ),
          );

          if (widget.onVerificationComplete != null) {
            widget.onVerificationComplete!();
          } else {
            Navigator.pop(context, true);
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content:
                  Text(result['message'] ?? 'Failed to submit verification'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isApproved = _existingVerification?['status'] == 'approved';
    final isPending = _existingVerification?['status'] == 'pending';
    final isRejected = _existingVerification?['status'] == 'rejected';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Identity Verification'),
        backgroundColor: const Color(0xFFFF385C),
        automaticallyImplyLeading: !widget.isRequired,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status Card
                if (_existingVerification != null) ...[
                  Card(
                    color: isApproved
                        ? Colors.green.shade50
                        : isPending
                            ? Colors.orange.shade50
                            : Colors.red.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(
                            isApproved
                                ? Icons.check_circle
                                : isPending
                                    ? Icons.pending
                                    : Icons.error,
                            color: isApproved
                                ? Colors.green
                                : isPending
                                    ? Colors.orange
                                    : Colors.red,
                            size: 40,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isApproved
                                      ? 'Verified'
                                      : isPending
                                          ? 'Pending Review'
                                          : 'Rejected',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isApproved
                                        ? Colors.green.shade900
                                        : isPending
                                            ? Colors.orange.shade900
                                            : Colors.red.shade900,
                                  ),
                                ),
                                if (isRejected &&
                                    _existingVerification!['rejectionReason'] !=
                                        null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    'Reason: ${_existingVerification!['rejectionReason']}',
                                    style: TextStyle(
                                      color: Colors.red.shade800,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Info Card
                Card(
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.info_outline,
                                color: Colors.blue.shade700),
                            const SizedBox(width: 8),
                            const Text(
                              'Why verify your identity?',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          '• Required for Room Rental and Roommate features\n'
                          '• Helps build trust in our community\n'
                          '• Protects all users\n'
                          '• Your information is kept secure',
                          style: TextStyle(height: 1.5),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Form Fields
                if (!isApproved || isRejected) ...[
                  const Text(
                    'Personal Information',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your full name';
                      }
                      return null;
                    },
                    enabled: !isPending,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                    keyboardType: TextInputType.phone,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter your phone number';
                      }
                      return null;
                    },
                    enabled: !isPending,
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    onTap: isPending ? null : _selectDate,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Date of Birth *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        _selectedDate != null
                            ? DateFormat('yyyy-MM-dd').format(_selectedDate!)
                            : 'Select date',
                        style: TextStyle(
                          color: _selectedDate != null
                              ? Colors.black
                              : Colors.grey,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'ID Card Photos',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildImagePicker(
                    'ID Card - Front Side *',
                    _idCardFront,
                    () => _pickImage(true),
                    isPending,
                  ),
                  const SizedBox(height: 16),
                  _buildImagePicker(
                    'ID Card - Back Side *',
                    _idCardBack,
                    () => _pickImage(false),
                    isPending,
                  ),
                  const SizedBox(height: 24),
                  if (!isPending)
                    CustomButton(
                      text: isRejected
                          ? 'Resubmit Verification'
                          : 'Submit Verification',
                      onPressed: _submitVerification,
                      icon: Icons.verified_user,
                    ),
                ],

                if (isPending) ...[
                  Card(
                    color: Colors.orange.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'Your verification is being reviewed by our admin team. You will be notified once it\'s approved.',
                        style: TextStyle(
                          color: Colors.orange.shade900,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImagePicker(
      String label, File? image, VoidCallback onTap, bool isDisabled) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: isDisabled ? null : onTap,
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: image != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(
                      image,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    ),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.add_photo_alternate,
                        size: 50,
                        color:
                            isDisabled ? Colors.grey : const Color(0xFFFF385C),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tap to upload',
                        style: TextStyle(
                          color: isDisabled ? Colors.grey : Colors.black54,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
}
