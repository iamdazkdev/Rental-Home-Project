import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import '../models/user.dart';
import '../config/app_constants.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token Management
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppConstants.keyToken, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: AppConstants.keyToken);
  }

  Future<void> deleteToken() async {
    await _secureStorage.delete(key: AppConstants.keyToken);
  }

  // User Management
  Future<void> saveUser(User user) async {
    final userJson = json.encode(user.toJson());
    await _prefs?.setString(AppConstants.keyUser, userJson);
  }

  Future<User?> getUser() async {
    final userJson = _prefs?.getString(AppConstants.keyUser);
    if (userJson == null) return null;

    try {
      final userMap = json.decode(userJson);
      return User.fromJson(userMap);
    } catch (e) {
      return null;
    }
  }

  Future<void> deleteUser() async {
    await _prefs?.remove(AppConstants.keyUser);
  }

  // Onboarding
  Future<void> setOnboardingCompleted() async {
    await _prefs?.setBool(AppConstants.keyOnboarding, true);
  }

  Future<bool> isOnboardingCompleted() async {
    return _prefs?.getBool(AppConstants.keyOnboarding) ?? false;
  }

  // Theme
  Future<void> setThemeMode(String mode) async {
    await _prefs?.setString(AppConstants.keyThemeMode, mode);
  }

  Future<String?> getThemeMode() async {
    return _prefs?.getString(AppConstants.keyThemeMode);
  }

  // Clear All Data
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs?.clear();
  }
}

