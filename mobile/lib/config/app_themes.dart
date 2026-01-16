import 'package:flutter/material.dart';

/// Application Themes
/// Contains both Light and Dark theme configurations
class AppThemes {
  // Brand Colors (consistent across themes)
  static const Color primaryColor = Color(0xFFFF385C);
  static const Color secondaryColor = Color(0xFF00A699);
  static const Color accentColor = Color(0xFFFFC107);

  // ========== LIGHT THEME ==========
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,

    // Colors
    primaryColor: primaryColor,
    scaffoldBackgroundColor: Colors.white,
    colorScheme: const ColorScheme.light(
      primary: primaryColor,
      secondary: secondaryColor,
      surface: Colors.white,
      error: Colors.red,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.black87,
      onError: Colors.white,
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: Colors.black87,
      elevation: 0,
      iconTheme: IconThemeData(color: Colors.black87),
      titleTextStyle: TextStyle(
        color: Colors.black87,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
    ),

    // Card
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),

    // Text
    textTheme: const TextTheme(
      displayLarge: TextStyle(
          color: Colors.black87, fontSize: 32, fontWeight: FontWeight.bold),
      displayMedium: TextStyle(
          color: Colors.black87, fontSize: 28, fontWeight: FontWeight.bold),
      displaySmall: TextStyle(
          color: Colors.black87, fontSize: 24, fontWeight: FontWeight.bold),
      headlineMedium: TextStyle(
          color: Colors.black87, fontSize: 20, fontWeight: FontWeight.w600),
      headlineSmall: TextStyle(
          color: Colors.black87, fontSize: 18, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(
          color: Colors.black87, fontSize: 16, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(
          color: Colors.black87, fontSize: 14, fontWeight: FontWeight.w500),
      titleSmall: TextStyle(
          color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w500),
      bodyLarge: TextStyle(color: Colors.black87, fontSize: 16),
      bodyMedium: TextStyle(color: Colors.black87, fontSize: 14),
      bodySmall: TextStyle(color: Colors.black54, fontSize: 12),
      labelLarge: TextStyle(
          color: Colors.black87, fontSize: 14, fontWeight: FontWeight.w500),
    ),

    // Input
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF7F7F7),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
    ),

    // Bottom Navigation
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: primaryColor,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
    ),

    // Icons
    iconTheme: const IconThemeData(
      color: Colors.black87,
    ),

    // Divider
    dividerColor: Colors.grey.shade300,
  );

  // ========== DARK THEME ==========
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,

    // Colors
    primaryColor: primaryColor,
    scaffoldBackgroundColor: const Color(0xFF121212),
    colorScheme: const ColorScheme.dark(
      primary: primaryColor,
      secondary: secondaryColor,
      surface: Color(0xFF1E1E1E),
      error: Colors.redAccent,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Colors.white,
      onError: Colors.white,
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF1E1E1E),
      foregroundColor: Colors.white,
      elevation: 0,
      iconTheme: IconThemeData(color: Colors.white),
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
    ),

    // Card
    cardTheme: CardThemeData(
      color: const Color(0xFF1E1E1E),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),

    // Text
    textTheme: const TextTheme(
      displayLarge: TextStyle(
          color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
      displayMedium: TextStyle(
          color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
      displaySmall: TextStyle(
          color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
      headlineMedium: TextStyle(
          color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600),
      headlineSmall: TextStyle(
          color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
      titleLarge: TextStyle(
          color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
      titleMedium: TextStyle(
          color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
      titleSmall: TextStyle(
          color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500),
      bodyLarge: TextStyle(color: Colors.white, fontSize: 16),
      bodyMedium: TextStyle(color: Colors.white, fontSize: 14),
      bodySmall: TextStyle(color: Colors.white70, fontSize: 12),
      labelLarge: TextStyle(
          color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
    ),

    // Input
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF2C2C2C),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 2),
      ),
    ),

    // Bottom Navigation
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Color(0xFF1E1E1E),
      selectedItemColor: primaryColor,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
    ),

    // Icons
    iconTheme: const IconThemeData(
      color: Colors.white,
    ),

    // Divider
    dividerColor: Colors.grey.shade800,
  );
}
