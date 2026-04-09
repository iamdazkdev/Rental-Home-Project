import '../entities/user.dart';

abstract class IAuthRepository {
  Future<UserEntity?> getCurrentUser();
  Future<bool> isLoggedIn();
  Future<UserEntity> login(String email, String password);
  Future<UserEntity> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? profileImage,
  });
  Future<void> logout();
}
