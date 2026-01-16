import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';

import 'config/app_theme.dart';
import 'data/repositories/booking_repository.dart';
import 'data/repositories/message_repository.dart';
import 'models/booking.dart';
import 'presentation/booking/cubit/booking_cubit.dart';
import 'presentation/booking/screens/booking_confirmation_screen.dart';
import 'presentation/booking/screens/booking_review_screen.dart';
import 'presentation/booking/screens/payment_callback_screen.dart';
import 'presentation/chat/cubit/chat_cubit.dart';
import 'providers/auth_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/bookings/extend_stay_screen.dart';
import 'screens/main_screen.dart';
import 'screens/messages/chat_screen.dart';
import 'screens/messages/conversations_screen.dart';
import 'screens/payment/payment_reminder_screen.dart';
import 'screens/reviews/reviews_list_screen.dart';
import 'screens/reviews/submit_review_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/trips/trips_screen.dart';
import 'screens/verification/identity_verification_screen.dart';
import 'services/fcm_service.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize storage
  await StorageService().init();

  // Initialize FCM
  await FCMService().initialize();

  // Setup background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  late AppLinks _appLinks;
  StreamSubscription? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  void _initDeepLinks() async {
    _appLinks = AppLinks();

    // Handle initial link if app was opened via deep link
    try {
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null) {
        _handleDeepLink(initialUri);
      }
    } catch (e) {
      debugPrint('Error getting initial link: $e');
    }

    // Handle incoming links when app is already running
    _linkSubscription = _appLinks.uriLinkStream.listen((Uri uri) {
      _handleDeepLink(uri);
    }, onError: (err) {
      debugPrint('Error listening to link stream: $err');
    });
  }

  void _handleDeepLink(Uri uri) {
    debugPrint('📱 Deep link received: $uri');
    debugPrint('   - Scheme: ${uri.scheme}');
    debugPrint('   - Host: ${uri.host}');
    debugPrint('   - Path: ${uri.path}');
    debugPrint('   - Query: ${uri.query}');

    if (uri.host == 'payment-callback') {
      // Extract query parameters from VNPay callback
      final queryParams = uri.queryParameters;
      debugPrint('   - Query params: $queryParams');

      _navigatorKey.currentState?.pushNamed(
        '/payment-callback',
        arguments: queryParams,
      );
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(
            create: (_) => NotificationProvider()..initialize()),
        // Add BookingCubit as global provider
        BlocProvider(
          create: (_) => BookingCubit(
            bookingRepository: BookingRepository(),
          ),
        ),
        // Add ChatCubit as global provider with current user ID
        ProxyProvider<AuthProvider, ChatCubit>(
          update: (context, authProvider, previous) {
            final userId = authProvider.user?.id ?? '';
            return ChatCubit(
              messageRepository: MessageRepository(),
              currentUserId: userId,
            );
          },
          dispose: (context, cubit) => cubit.close(),
        ),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'Rental Home',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const SplashScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const MainScreen(),
          '/trips': (context) => const TripsScreen(),
          '/conversations': (context) => const ConversationsScreen(),
        },
        onGenerateRoute: (settings) {
          // Handle dynamic routes with arguments
          switch (settings.name) {
            case '/booking-review':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => BookingReviewScreen(
                  listing: args['listing'],
                  checkIn: args['checkIn'],
                  checkOut: args['checkOut'],
                  nights: args['nights'],
                  totalPrice: args['totalPrice'],
                ),
              );

            case '/payment-callback':
              final queryParams = settings.arguments as Map<String, String>;
              return MaterialPageRoute(
                builder: (_) => PaymentCallbackScreen(
                  queryParams: queryParams,
                ),
              );

            case '/booking-confirmation':
              final booking = settings.arguments as BookingModel;
              return MaterialPageRoute(
                builder: (_) => BookingConfirmationScreen(
                  booking: booking,
                ),
              );

            case '/identity-verification':
              final args = settings.arguments as Map<String, dynamic>?;
              return MaterialPageRoute(
                builder: (_) => IdentityVerificationScreen(
                  isRequired: args?['isRequired'] ?? false,
                  onVerificationComplete: args?['onComplete'],
                ),
              );

            case '/payment-reminder':
              final bookingId = settings.arguments as String;
              return MaterialPageRoute(
                builder: (_) => PaymentReminderScreen(
                  bookingId: bookingId,
                ),
              );

            case '/extend-stay':
              final booking = settings.arguments as BookingModel;
              return MaterialPageRoute(
                builder: (_) => ExtendStayScreen(
                  booking: booking,
                ),
              );

            case '/submit-review':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => SubmitReviewScreen(
                  booking: args['booking'] as BookingModel,
                  onReviewSubmitted: args['onReviewSubmitted'] as VoidCallback?,
                ),
              );

            case '/reviews-list':
              final listingId = settings.arguments as String;
              return MaterialPageRoute(
                builder: (_) => ReviewsListScreen(
                  listingId: listingId,
                ),
              );

            case '/chat':
              final args = settings.arguments as Map<String, dynamic>;
              return MaterialPageRoute(
                builder: (_) => ChatScreen(
                  conversationId: args['conversationId'],
                  otherUserId: args['otherUserId'],
                  otherUserName: args['otherUserName'],
                  otherUserAvatar: args['otherUserAvatar'],
                  listingId: args['listingId'],
                ),
              );

            default:
              return null;
          }
        },
      ),
    );
  }
}
