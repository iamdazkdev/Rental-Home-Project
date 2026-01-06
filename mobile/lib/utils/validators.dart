class Validators {
  // Email validation
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }

    return null;
  }

  // Password validation
  static String? validatePassword(String? value, {int minLength = 6}) {
    if (value == null || value.isEmpty) {
      return 'Please enter your password';
    }

    if (value.length < minLength) {
      return 'Password must be at least $minLength characters';
    }

    return null;
  }

  // Confirm password validation
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }

    if (value != password) {
      return 'Passwords do not match';
    }

    return null;
  }

  // Name validation
  static String? validateName(String? value, {String field = 'name'}) {
    if (value == null || value.isEmpty) {
      return 'Please enter your $field';
    }

    if (value.length < 2) {
      return '${field[0].toUpperCase()}${field.substring(1)} must be at least 2 characters';
    }

    return null;
  }

  // Required field validation
  static String? validateRequired(String? value, {String field = 'field'}) {
    if (value == null || value.isEmpty) {
      return 'Please enter $field';
    }

    return null;
  }

  // Number validation
  static String? validateNumber(String? value, {String field = 'number'}) {
    if (value == null || value.isEmpty) {
      return 'Please enter $field';
    }

    final number = int.tryParse(value);
    if (number == null) {
      return 'Please enter a valid number';
    }

    return null;
  }

  // Positive number validation
  static String? validatePositiveNumber(String? value, {String field = 'number'}) {
    if (value == null || value.isEmpty) {
      return 'Please enter $field';
    }

    final number = int.tryParse(value);
    if (number == null || number <= 0) {
      return 'Please enter a valid positive number';
    }

    return null;
  }

  // Price validation
  static String? validatePrice(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter price';
    }

    final price = double.tryParse(value);
    if (price == null || price <= 0) {
      return 'Please enter a valid price';
    }

    return null;
  }

  // Phone number validation
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your phone number';
    }

    final phoneRegex = RegExp(r'^\+?[\d\s-]{10,}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Please enter a valid phone number';
    }

    return null;
  }

  // URL validation
  static String? validateUrl(String? value) {
    if (value == null || value.isEmpty) {
      return null; // URL is optional
    }

    final urlRegex = RegExp(
      r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
    );

    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL';
    }

    return null;
  }

  // Min length validation
  static String? validateMinLength(String? value, int minLength, {String field = 'field'}) {
    if (value == null || value.isEmpty) {
      return 'Please enter $field';
    }

    if (value.length < minLength) {
      return '${field[0].toUpperCase()}${field.substring(1)} must be at least $minLength characters';
    }

    return null;
  }

  // Max length validation
  static String? validateMaxLength(String? value, int maxLength, {String field = 'field'}) {
    if (value != null && value.length > maxLength) {
      return '${field[0].toUpperCase()}${field.substring(1)} must be at most $maxLength characters';
    }

    return null;
  }
}

