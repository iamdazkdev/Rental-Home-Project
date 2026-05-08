import 'package:equatable/equatable.dart';

/// Base failure class for structured error handling.
///
/// Services and repositories should throw typed [Failure] subclasses
/// instead of raw [Exception]s. Cubits/BLoCs can then pattern-match
/// on the failure type to display the right UI message.
abstract class Failure extends Equatable {
  final String message;
  final int? statusCode;

  const Failure({required this.message, this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];

  @override
  String toString() =>
      '$runtimeType(message: $message, statusCode: $statusCode)';
}

/// Failure originating from the server (HTTP 4xx/5xx).
class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.statusCode});

  factory ServerFailure.fromStatusCode(int statusCode, [String? body]) {
    final defaultMessages = {
      400: 'Bad request',
      401: 'Unauthorized – please log in again',
      403: 'Forbidden – you do not have permission',
      404: 'Resource not found',
      409: 'Conflict – resource already exists',
      422: 'Validation error',
      429: 'Too many requests – please try again later',
      500: 'Internal server error',
      502: 'Service temporarily unavailable',
      503: 'Service unavailable – please try again later',
    };

    return ServerFailure(
      message:
          body ?? defaultMessages[statusCode] ?? 'Server error ($statusCode)',
      statusCode: statusCode,
    );
  }
}

/// Network connectivity failures (no internet, DNS, timeout).
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection. Please check your network.',
  });
}

/// Local cache / storage failures.
class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Failed to access local storage.',
  });
}

/// Authentication failures (token expired, invalid credentials).
class AuthFailure extends Failure {
  const AuthFailure({
    super.message = 'Authentication failed. Please log in again.',
  });
}
