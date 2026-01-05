import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../data/models/identity_verification_model.dart';
import '../services/identity_verification_service.dart';

/// Widget to check identity verification status and prompt user if needed
class VerificationRequiredDialog extends StatelessWidget {
  final IdentityVerification? verification;
  final VoidCallback onVerifyNow;
  final VoidCallback onCancel;

  const VerificationRequiredDialog({
    super.key,
    this.verification,
    required this.onVerifyNow,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final status = verification?.status;
    final isPending = status == VerificationStatus.pending;
    final isRejected = status == VerificationStatus.rejected;

    String title;
    String message;
    IconData icon;
    Color iconColor;

    if (verification == null) {
      title = 'Identity Verification Required';
      message = 'To proceed with this action, you need to verify your identity first. '
          'This helps us maintain a safe community for all users.';
      icon = Icons.verified_user_outlined;
      iconColor = AppTheme.primaryColor;
    } else if (isPending) {
      title = 'Verification Pending';
      message = 'Your identity verification is being reviewed. '
          'We\'ll notify you once it\'s approved. This usually takes 1-2 business days.';
      icon = Icons.hourglass_empty;
      iconColor = AppTheme.warningColor;
    } else if (isRejected) {
      title = 'Verification Rejected';
      message = 'Your identity verification was rejected.\n\n'
          'Reason: ${verification?.rejectionReason ?? "Please update your information"}\n\n'
          'Please update your information and try again.';
      icon = Icons.error_outline;
      iconColor = AppTheme.errorColor;
    } else {
      // Should not reach here if already approved
      title = 'Verification Status';
      message = 'Your verification status: ${status?.value ?? "Unknown"}';
      icon = Icons.info_outline;
      iconColor = Colors.grey;
    }

    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 40, color: iconColor),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18),
          ),
        ],
      ),
      content: Text(
        message,
        textAlign: TextAlign.center,
        style: TextStyle(color: Colors.grey[700]),
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        if (isPending) ...[
          TextButton(
            onPressed: onCancel,
            child: const Text('OK, I\'ll Wait'),
          ),
        ] else ...[
          TextButton(
            onPressed: onCancel,
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: onVerifyNow,
            child: Text(isRejected ? 'Update Info' : 'Verify Now'),
          ),
        ],
      ],
    );
  }
}

/// Check verification and show dialog if needed
Future<bool> checkVerificationAndPrompt({
  required BuildContext context,
  required String userId,
  required VoidCallback onVerifyPressed,
}) async {
  final service = IdentityVerificationService();
  final result = await service.getVerificationStatus(userId);

  if (!result['exists']) {
    return false;
  }

  final status = result['status'];

  // If approved, allow to proceed
  if (status == 'approved') {
    return true;
  }

  // Parse verification data
  IdentityVerification? verification;
  if (result['verification'] != null) {
    try {
      verification = IdentityVerification.fromJson(result['verification']);
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Show dialog for other cases
  if (context.mounted) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => VerificationRequiredDialog(
        verification: verification,
        onVerifyNow: () {
          Navigator.of(ctx).pop();
          onVerifyPressed();
        },
        onCancel: () => Navigator.of(ctx).pop(),
      ),
    );
  }

  return false;
}

/// Simple verification status banner for screens
class VerificationStatusBanner extends StatelessWidget {
  final VerificationStatus status;
  final String? rejectionReason;
  final VoidCallback? onUpdatePressed;

  const VerificationStatusBanner({
    super.key,
    required this.status,
    this.rejectionReason,
    this.onUpdatePressed,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    IconData icon;
    String message;

    switch (status) {
      case VerificationStatus.pending:
        bgColor = Colors.orange.withValues(alpha: 0.1);
        textColor = Colors.orange[700]!;
        icon = Icons.hourglass_empty;
        message = 'Identity verification is pending review';
        break;
      case VerificationStatus.rejected:
        bgColor = Colors.red.withValues(alpha: 0.1);
        textColor = Colors.red[700]!;
        icon = Icons.error_outline;
        message = rejectionReason ?? 'Verification rejected. Please update your info.';
        break;
      case VerificationStatus.approved:
        bgColor = Colors.green.withValues(alpha: 0.1);
        textColor = Colors.green[700]!;
        icon = Icons.verified;
        message = 'Identity verified';
        break;
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: textColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: textColor, fontSize: 13),
            ),
          ),
          if (status == VerificationStatus.rejected && onUpdatePressed != null)
            TextButton(
              onPressed: onUpdatePressed,
              child: const Text('Update'),
            ),
        ],
      ),
    );
  }
}

