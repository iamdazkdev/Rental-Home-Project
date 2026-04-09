import 'package:injectable/injectable.dart';
import '../repositories/auth_repository.dart';
import '../entities/user.dart';

@injectable
class LoginUseCase {
  final IAuthRepository repository;

  LoginUseCase(this.repository);

  Future<UserEntity> call(String email, String password) =>
      repository.login(email, password);
}

@injectable
class LogoutUseCase {
  final IAuthRepository repository;

  LogoutUseCase(this.repository);

  Future<void> call() => repository.logout();
}

@injectable
class GetCurrentUserUseCase {
  final IAuthRepository repository;

  GetCurrentUserUseCase(this.repository);

  Future<UserEntity?> call() => repository.getCurrentUser();
}
