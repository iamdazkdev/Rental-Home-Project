---
Tên tài liệu: Kế Hoạch Tái Cấu Trúc và Sửa Lỗi Mobile (Flutter)
Ngày review/lập kế hoạch: 06/05/2026
Người lập: Dazk Dev
Trạng thái: Sẵn sàng thực hiện
---

# Mobile App Refactoring & Fix Plan (Flutter)

This document outlines a phased approach to fixing the issues identified in the mobile code review. The plan is designed to be executed sequentially, minimizing regressions by prioritizing critical bugs before undertaking architectural improvements.

## Phase 1: Critical Bug Fixes (Authentication)

**Goal:** Ensure users can log in successfully and their session is persisted correctly so they can access protected API endpoints.

- [ ] **Step 1.1: Update Auth Models**
  - Create a new `AuthResponseModel` (or update existing) to parse and hold both the `UserModel` and the JWT `token` from the backend response.
- [ ] **Step 1.2: Fix `AuthRemoteDataSourceImpl`**
  - Modify `login` and `register` methods in `mobile/lib/features/auth/data/datasources/auth_remote_datasource.dart` to return the new `AuthResponseModel` instead of just `UserModel`.
- [ ] **Step 1.3: Fix `AuthRepositoryImpl`**
  - Update `mobile/lib/features/auth/data/repositories/auth_repository_impl.dart`.
  - Extract the `token` from the `AuthResponseModel`.
  - Save the token using `StorageService().saveToken(token)`.
  - Save the user entity using `StorageService().saveUser(user)`.
  - Return the mapped `UserEntity`.

## Phase 2: Environment Configuration & Cleanup

**Goal:** Remove hardcoded constants, secure API endpoints, and clean up the repository.

- [ ] **Step 2.1: Implement `.env` support**
  - Add `flutter_dotenv` to `pubspec.yaml`.
  - Create `.env.development` and `.env.production` files containing `BASE_URL` and `SOCKET_URL`.
  - Update `mobile/lib/main.dart` to load `.env` based on the environment.
- [ ] **Step 2.2: Refactor `ApiConfig`**
  - Update `mobile/lib/config/api_config.dart` to read `baseUrl` and `socketUrl` dynamically from `dotenv.env`.
- [ ] **Step 2.3: Remove Workspace Clutter**
  - Delete `check.txt`, `check2.txt`, `check3.txt`, `check_again.txt`, `final_check.txt` from the `mobile/` root directory.

## Phase 3: Networking Consolidation

**Goal:** Unify the HTTP client to simplify request interceptors and reduce app size.

- [ ] **Step 3.1: Remove `http` dependency**
  - Remove `http: ^1.1.2` from `pubspec.yaml`.
- [ ] **Step 3.2: Implement `Dio` Client & Interceptor**
  - Create a core `DioClient` singleton or injectable provider.
  - Create an `AuthInterceptor` that automatically injects the `Bearer token` from `StorageService` into the headers of all outbound API requests.
- [ ] **Step 3.3: Refactor Data Sources**
  - Refactor `AuthRemoteDataSourceImpl` and any other existing repositories/datasources to use the new `DioClient` instead of `http`.

## Phase 4: State Management & Architecture Standardization

**Goal:** Migrate entirely to Clean Architecture with `flutter_bloc` and remove the legacy `Provider` setup.

- [ ] **Step 4.1: Audit Legacy Providers**
  - Review all legacy providers (e.g., `AuthProvider`, `ThemeProvider`, `NotificationProvider`).
  - Translate their logic into distinct BLoCs/Cubits (e.g., `AppThemeCubit`, `NotificationBloc`).
- [ ] **Step 4.2: Migrate UI to Bloc**
  - Refactor all screens currently using `Consumer<AuthProvider>` or `context.read<AuthProvider>()` (e.g., `SplashScreen`, `MainScreen`) to use `BlocBuilder` or `BlocListener` with the respective `AuthBloc`.
- [ ] **Step 4.3: Consolidate `main.dart`**
  - Remove the legacy `ChangeNotifierProvider` declarations from `main.dart`.
  - Ensure all DI uses `get_it` and `injectable`.
- [ ] **Step 4.4: Final Cleanup**
  - Remove `provider: ^6.1.5+1` and `flutter_riverpod: ^2.4.9` from `pubspec.yaml`.
  - Delete the `mobile/lib/providers/` directory once fully migrated.
  - Restructure any remaining legacy `screens/` into the feature-based folder structure inside `lib/features/`.
