import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// VNPay Payment WebView Screen
/// Handles VNPay payment and intercepts callback URL
class VNPayPaymentScreen extends StatefulWidget {
  final String paymentUrl;
  final String tempOrderId;

  const VNPayPaymentScreen({
    Key? key,
    required this.paymentUrl,
    required this.tempOrderId,
  }) : super(key: key);

  @override
  State<VNPayPaymentScreen> createState() => _VNPayPaymentScreenState();
}

class _VNPayPaymentScreenState extends State<VNPayPaymentScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isProcessingCallback = false;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100) {
              setState(() => _isLoading = false);
            }
          },
          onPageStarted: (String url) {
            debugPrint('🌐 Page started: $url');
            _handleUrlChange(url);
          },
          onPageFinished: (String url) {
            debugPrint('✅ Page finished: $url');
            setState(() => _isLoading = false);
          },
          onNavigationRequest: (NavigationRequest request) {
            debugPrint('🔍 Navigation request: ${request.url}');

            // Check if this is VNPay callback URL
            if (_isVNPayCallback(request.url)) {
              _handleVNPayCallback(request.url);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  bool _isVNPayCallback(String url) {
    // Check if URL contains VNPay callback parameters
    return url.contains('vnpay-callback') ||
           url.contains('vnp_ResponseCode') ||
           url.contains('payment-callback');
  }

  void _handleUrlChange(String url) {
    if (_isVNPayCallback(url) && !_isProcessingCallback) {
      _handleVNPayCallback(url);
    }
  }

  Future<void> _handleVNPayCallback(String callbackUrl) async {
    if (_isProcessingCallback) return;

    setState(() => _isProcessingCallback = true);

    debugPrint('💳 VNPay callback detected: $callbackUrl');

    // Parse URL parameters
    final uri = Uri.parse(callbackUrl);
    final responseCode = uri.queryParameters['vnp_ResponseCode'];
    final transactionId = uri.queryParameters['vnp_TransactionNo'] ?? '';

    debugPrint('📥 VNPay response code: $responseCode');
    debugPrint('📥 VNPay transaction ID: $transactionId');

    if (responseCode == '00') {
      // Payment successful
      debugPrint('✅ Payment successful!');

      // Create booking from payment
      if (mounted) {
        // Show loading message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful! Creating booking...'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        // Create payment data from VNPay callback parameters
        final paymentData = uri.queryParameters;

        // Wait a moment for the user to see the success message
        await Future.delayed(const Duration(milliseconds: 500));

        if (mounted) {
          // Return payment data to the previous screen
          Navigator.of(context).pop({
            'success': true,
            'tempOrderId': widget.tempOrderId,
            'transactionId': transactionId,
            'paymentData': paymentData,
          });
        }
      }
    } else {
      // Payment failed
      debugPrint('❌ Payment failed with code: $responseCode');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment failed (Code: $responseCode)'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );

        await Future.delayed(const Duration(seconds: 2));

        if (mounted) {
          Navigator.of(context).pop({
            'success': false,
            'responseCode': responseCode,
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VNPay Payment'),
        backgroundColor: const Color(0xFF4CAF50),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              _showCancelDialog();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF4CAF50),
              ),
            ),
          if (_isProcessingCallback)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text(
                          'Processing payment...',
                          style: TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Payment'),
        content: const Text('Are you sure you want to cancel this payment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context, false); // Close webview with failure
            },
            child: const Text(
              'Yes, Cancel',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}

