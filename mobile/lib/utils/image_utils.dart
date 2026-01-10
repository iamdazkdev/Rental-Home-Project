import '../config/api_config.dart';

class ImageUtils {
  /// Get full image URL from path
  static String getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) {
      return '';
    }

    // If already a full URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a relative path, prepend base URL
    return '${ApiConfig.baseUrl}/$imagePath'.replaceAll('//', '/');
  }

  /// Get placeholder image URL
  static String getPlaceholderUrl() {
    return 'https://via.placeholder.com/400x300?text=No+Image';
  }

  /// Get user avatar URL or placeholder
  static String getUserAvatarUrl(String? avatarPath) {
    if (avatarPath == null || avatarPath.isEmpty) {
      return 'https://ui-avatars.com/api/?name=User&background=random';
    }
    return getImageUrl(avatarPath);
  }
}
