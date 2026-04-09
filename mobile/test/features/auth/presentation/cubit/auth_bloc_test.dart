import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:rental_home/features/auth/domain/entities/user.dart';
import 'package:rental_home/features/auth/domain/usecases/auth_usecases.dart';
import 'package:rental_home/features/auth/presentation/cubit/auth_bloc.dart';

class MockLoginUseCase extends Mock implements LoginUseCase {}
class MockLogoutUseCase extends Mock implements LogoutUseCase {}
class MockGetCurrentUserUseCase extends Mock implements GetCurrentUserUseCase {}

void main() {
  late MockLoginUseCase mockLoginUseCase;
  late MockLogoutUseCase mockLogoutUseCase;
  late MockGetCurrentUserUseCase mockGetCurrentUserUseCase;
  late AuthBloc authBloc;

  final testUser = const UserEntity(
    id: '123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
  );

  setUp(() {
    mockLoginUseCase = MockLoginUseCase();
    mockLogoutUseCase = MockLogoutUseCase();
    mockGetCurrentUserUseCase = MockGetCurrentUserUseCase();
    authBloc = AuthBloc(
      mockLoginUseCase,
      mockLogoutUseCase,
      mockGetCurrentUserUseCase,
    );
  });

  tearDown(() {
    authBloc.close();
  });

  group('AuthBloc', () {
    test('initial state is AuthInitial', () {
      expect(authBloc.state, isA<AuthInitial>());
    });

    test('emits [AuthAuthenticated] when AuthCheckRequested and user exists', () async {
      when(() => mockGetCurrentUserUseCase.call())
          .thenAnswer((_) async => testUser);

      final expectedResponse = [
        AuthAuthenticated(testUser),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedResponse));

      authBloc.add(AuthCheckRequested());
    });

    test('emits [AuthUnauthenticated] when AuthCheckRequested and user does not exist', () async {
      when(() => mockGetCurrentUserUseCase.call())
          .thenAnswer((_) async => null);

      final expectedResponse = [
        isA<AuthUnauthenticated>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedResponse));

      authBloc.add(AuthCheckRequested());
    });

    test('emits [AuthLoading, AuthAuthenticated] when AuthLoginRequested is successful', () async {
      const email = 'test@example.com';
      const password = 'password123';

      when(() => mockLoginUseCase.call(email, password))
          .thenAnswer((_) async => testUser);

      final expectedResponse = [
        isA<AuthLoading>(),
        AuthAuthenticated(testUser),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedResponse));

      authBloc.add(const AuthLoginRequested(email, password));
    });

    test('emits [AuthLoading, AuthError, AuthUnauthenticated] when AuthLoginRequested fails', () async {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      final exception = Exception('Invalid credentials');

      when(() => mockLoginUseCase.call(email, password))
          .thenThrow(exception);

      final expectedResponse = [
        isA<AuthLoading>(),
        isA<AuthError>(),
        isA<AuthUnauthenticated>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedResponse));

      authBloc.add(const AuthLoginRequested(email, password));
    });

    test('emits [AuthUnauthenticated] when AuthLogoutRequested is called', () async {
      when(() => mockLogoutUseCase.call())
          .thenAnswer((_) async => Future.value());

      final expectedResponse = [
        isA<AuthUnauthenticated>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedResponse));

      authBloc.add(AuthLogoutRequested());
    });
  });
}
