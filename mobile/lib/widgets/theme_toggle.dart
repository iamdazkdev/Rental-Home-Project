import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/theme_provider.dart';

/// Theme Toggle Widget
/// Displays a switch to toggle between light and dark mode
class ThemeToggle extends StatelessWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;

        return ListTile(
          leading: Icon(
            isDark ? Icons.dark_mode : Icons.light_mode,
            color: isDark ? Colors.amber : Colors.orange,
          ),
          title: Text(
            'Dark Mode',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          subtitle: Text(
            isDark ? 'Enabled' : 'Disabled',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          trailing: Switch(
            value: isDark,
            onChanged: (value) {
              themeProvider.toggleTheme();
            },
            activeColor: Theme.of(context).primaryColor,
          ),
        );
      },
    );
  }
}

/// Compact Theme Toggle (for settings)
class CompactThemeToggle extends StatelessWidget {
  final String? label;

  const CompactThemeToggle({
    super.key,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        final isDark = themeProvider.isDarkMode;

        return SwitchListTile(
          title: Text(label ?? 'Dark Mode'),
          subtitle: Text(isDark ? 'Dark theme enabled' : 'Light theme enabled'),
          value: isDark,
          onChanged: (value) {
            themeProvider.toggleTheme();
          },
          secondary: Icon(
            isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
            color: Theme.of(context).primaryColor,
          ),
        );
      },
    );
  }
}
