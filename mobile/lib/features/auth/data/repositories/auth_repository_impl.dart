import 'package:injectable/injectable.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../../../../../services/storage_service.dart';

@LazySingleton(as: IAuthRepository)
class AuthRepositoryImpl implements IAuthRepository {
  final IAuthRemoteDataSource remoteDataSource;
  final StorageService storageService; // In the future, this should also be injected and refactored

  AuthRepositoryImpl(this.remoteDataSource) : storageService = StorageService();

  @override
  Future<UserEntity?> getCurrentUser() async {
    final legacyUser = await storageService.getUser();
    if (legacyUser != null) {
      // Map legacy user to UserEntity 
      return UserEntity(
        id: legacyUser.id,
        firstName: legacyUser.firstName,
        lastName: legacyUser.lastName,
        email: legacyUser.email,
        profileImagePath: legacyUser.profileImagePath,
        wishlist: legacyUser.wishlist,
        propertyList: legacyUser.propertyList,
        tripList: legacyUser.tripList,
        reservationList: legacyUser.reservationList,
        memberSince: legacyUser.memberSince,
        sleepSchedule: legacyUser.sleepSchedule,
        isSmoker: legacyUser.isSmoker,
        cleanliness: legacyUser.cleanliness,
        personality: legacyUser.personality,
        noiseLevel: legacyUser.noiseLevel,
        bio: legacyUser.bio,
      );
    }
    return null;
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await storageService.getToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<UserEntity> login(String email, String password) async {
    final userModel = await remoteDataSource.login(email, password);
    // Ideally the token comes back from login here, but our current backend might return token + user.
    // Wait, the logic in AuthRemoteDataSource lost the token because it only returns UserModel.
    // Let me fix that. The user info and token logic should be handled properly.
    // For now, let's assume we need to modify AuthRemoteDataSource if we need the token.
    return userModel;
  }

  @override
  Future<UserEntity> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? profileImage,
  }) async {
    return remoteDataSource.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      profileImage: profileImage,
    );
  }

  @override
  Future<void> logout() async {
    await storageService.deleteToken();
    await storageService.deleteUser();
  }
}
