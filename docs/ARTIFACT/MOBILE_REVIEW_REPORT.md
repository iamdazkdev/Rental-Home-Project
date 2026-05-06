---
Tên tài liệu: Báo Cáo Đánh Giá Mã Nguồn Mobile (Flutter)
Ngày review: 06/05/2026
Người đánh giá: Dazk Dev
Trạng thái: Đã hoàn thành (Chờ xử lý lỗi)
---

# Mobile App Code Review Report (Flutter)

## 1. Architectural Inconsistencies & State Management

The current mobile app architecture is in a transitional state, causing significant fragmentation and technical debt.

### Issue: Mixing Legacy and Clean Architecture

- The `lib/` directory contains legacy layered folders (`screens`, `providers`, `models`, `services`) alongside a new Clean Architecture structure (`features/`, `core/`).
- This means code is split between two entirely different architectural paradigms.

### Issue: Multiple State Management Solutions

- `pubspec.yaml` contains `provider`, `flutter_riverpod`, and `flutter_bloc`.
- **Confirmation:** The codebase is actively using **both** `Provider` (legacy, e.g., in `screens/splash_screen.dart` and `AuthProvider`) and `flutter_bloc` (new setup, e.g., in `AuthBloc` and `features/`).
- **Impact:** This causes confusing data flows, duplicated state (e.g., Auth is handled in both `AuthProvider` and `AuthBloc`), and difficult maintenance.

**Recommendation:** Complete the migration to Clean Architecture and exclusively use `flutter_bloc` (since it aligns well with Clean Architecture and is already set up with `get_it` and `injectable`). Remove `provider` and `flutter_riverpod` from the project.

## 2. Critical Authentication Bug

There is a severe flaw in the new `features/auth` implementation where the authentication token is completely lost during the login flow.

### Details

In `AuthRemoteDataSourceImpl` (`mobile/lib/features/auth/data/datasources/auth_remote_datasource.dart`):

```dart
if (data['user'] != null) {
  return UserModel.fromJson(data['user']);
  // Note: Token and User storage will be handled by Repository
}
```

The response returns a token, but the datasource *only* extracts and returns the `UserModel`. The token is discarded.

Then, in `AuthRepositoryImpl` (`mobile/lib/features/auth/data/repositories/auth_repository_impl.dart`):

```dart
@override
Future<UserEntity> login(String email, String password) async {
  final userModel = await remoteDataSource.login(email, password);
  // Ideally the token comes back from login here, but our current backend might return token + user.
  // Wait, the logic in AuthRemoteDataSource lost the token because it only returns UserModel.
  return userModel;
}
```

As acknowledged in the comments, the repository receives the user but **has no access to the token**. Consequently, `storageService.saveToken()` is never called, and subsequent authenticated API requests will fail with `401 Unauthorized`.

**Recommendation:**

1. Create an `AuthResponseModel` that contains both the `UserModel` and the `String token`.
2. Update `AuthRemoteDataSource` to return `AuthResponseModel`.
3. Update `AuthRepositoryImpl` to extract the token, save it via `StorageService`, and return the mapped `UserEntity`.

## 3. Dependency Bloat

The `pubspec.yaml` file contains redundant or unused packages.

### Issue: Duplicate HTTP Clients

The project includes both `http` and `dio`:

```yaml
  http: ^1.1.2
  dio: ^5.4.0
```

Currently, `AuthRemoteDataSourceImpl` uses `http`, but `dio` is also included. Keeping both increases the app size and fragments the networking layer (some parts might use `http` while others use `dio`).

**Recommendation:** Standardize on one HTTP client (preferably `dio` since it offers built-in interceptors which are excellent for injecting Auth Tokens automatically) and remove the other.

## 4. Hardcoded Environment Configurations

### Issue: `ApiConfig` Hardcoded URLs

In `lib/config/api_config.dart`, URLs are hardcoded:

```dart
class ApiConfig {
  // Base URL - Production (Render)
  static String baseUrl = 'https://rental-home-project-qssf.onrender.com';
  // static String baseUrl = 'http://192.168.1.37:3001'; // Local development
}
```

Switching environments requires manually commenting/uncommenting code, which is prone to errors (e.g., accidentally committing a localhost URL to production).

**Recommendation:** Use `flutter_dotenv` to load `.env` files or utilize `--dart-define` to inject variables at compile time.

## 5. File Structure Cleanliness

There are several temporary/test files polluting the project root that should be removed or moved to a scratch directory:

- `check.txt`
- `check2.txt`
- `check3.txt`
- `check_again.txt`
- `final_check.txt`

## Summary Action Plan

1. **Fix Auth Flow (High Priority):** Update the data models and datasource/repository to capture and securely store the JWT token upon login.
2. **Standardize State Management:** Proceed with the migration to Clean Architecture and `flutter_bloc`. Deprecate and remove `AuthProvider` and `provider` usage.
3. **Consolidate Networking:** Choose `dio`, write an `AuthInterceptor` to attach the Bearer token to all requests, and remove `http`.
4. **Environment Variables:** Implement `.env` support for dynamic configuration.
