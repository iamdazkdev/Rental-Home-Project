import 'package:flutter/material.dart';

class AmenityIcons {
  static final Map<String, IconData> iconMap = {
    // Kitchen & Dining
    'Kitchen': Icons.kitchen,
    'Refrigerator': Icons.kitchen_outlined,
    'Microwave': Icons.microwave,
    'Dishwasher': Icons.countertops,
    'Coffee maker': Icons.coffee,
    'Dining table': Icons.table_restaurant,

    // Laundry
    'Washer': Icons.local_laundry_service,
    'Dryer': Icons.dry_cleaning,
    'Iron': Icons.iron,
    'Hangers': Icons.checkroom,

    // Bathroom
    'Hair dryer': Icons.dry,
    'Shampoo': Icons.shower,
    'Hot water': Icons.water_drop,
    'Bathtub': Icons.bathtub,

    // Bedroom & Living
    'Bed linens': Icons.bed,
    'Extra pillows': Icons.weekend,
    'Heating': Icons.thermostat,
    'Air conditioning': Icons.ac_unit,
    'TV': Icons.tv,
    'Sound system': Icons.speaker,

    // Workspace
    'Wifi': Icons.wifi,
    'Dedicated workspace': Icons.desk,
    'Laptop friendly workspace': Icons.laptop,

    // Outdoor
    'Pool': Icons.pool,
    'Hot tub': Icons.hot_tub,
    'BBQ grill': Icons.outdoor_grill,
    'Fire pit': Icons.fireplace,
    'Garden': Icons.grass,
    'Beach access': Icons.beach_access,
    'Lake access': Icons.water,
    'Ski-in/Ski-out': Icons.downhill_skiing,
    'Outdoor furniture': Icons.chair,
    'Outdoor dining area': Icons.deck,
    'Patio': Icons.balcony,
    'Balcony': Icons.balcony,

    // Safety & Security
    'Smoke alarm': Icons.alarm,
    'Carbon monoxide alarm': Icons.sensors,
    'Fire extinguisher': Icons.fire_extinguisher,
    'First aid kit': Icons.medical_services,
    'Security cameras': Icons.videocam,
    'Lock on bedroom door': Icons.lock,
    'Safe': Icons.security,

    // Parking & Transportation
    'Free parking': Icons.local_parking,
    'Paid parking': Icons.paid,
    'EV charger': Icons.ev_station,
    'Garage': Icons.garage,

    // Entertainment
    'Game console': Icons.games,
    'Board games': Icons.sports_esports,
    'Books': Icons.menu_book,
    'Piano': Icons.piano,
    'Exercise equipment': Icons.fitness_center,
    'Gym': Icons.fitness_center,

    // Family
    'Baby crib': Icons.crib,
    'High chair': Icons.chair,
    'Baby bath': Icons.bathtub,
    'Childrens books and toys': Icons.toys,
    'Pack n play': Icons.baby_changing_station,

    // Services
    'Self check-in': Icons.key,
    'Keypad': Icons.dialpad,
    'Lockbox': Icons.lock_open,
    'Long term stays allowed': Icons.event_available,
    'Cleaning available': Icons.cleaning_services,
    'Host greeting': Icons.waving_hand,

    // Accessibility
    'Step-free guest entrance': Icons.accessible,
    'Wide entrance': Icons.door_sliding,
    'Accessible-height bed': Icons.hotel,
    'Elevator': Icons.elevator,

    // Others
    'Pets allowed': Icons.pets,
    'Smoking allowed': Icons.smoking_rooms,
    'Events allowed': Icons.celebration,
    'Private entrance': Icons.door_sliding,
    'Essentials': Icons.shopping_basket,
  };

  static IconData getIcon(String amenity) {
    // Try exact match first
    if (iconMap.containsKey(amenity)) {
      return iconMap[amenity]!;
    }

    // Try case-insensitive match
    final key = iconMap.keys.firstWhere(
      (k) => k.toLowerCase() == amenity.toLowerCase(),
      orElse: () => '',
    );

    if (key.isNotEmpty) {
      return iconMap[key]!;
    }

    // Default icon
    return Icons.check_circle_outline;
  }

  static Color getColor(String amenity) {
    // Color coding by category
    final amenityLower = amenity.toLowerCase();

    if (amenityLower.contains('wifi') || amenityLower.contains('tv')) {
      return Colors.blue;
    } else if (amenityLower.contains('pool') || amenityLower.contains('hot tub')) {
      return Colors.cyan;
    } else if (amenityLower.contains('kitchen') || amenityLower.contains('coffee')) {
      return Colors.orange;
    } else if (amenityLower.contains('air') || amenityLower.contains('heating')) {
      return Colors.red;
    } else if (amenityLower.contains('parking') || amenityLower.contains('garage')) {
      return Colors.purple;
    } else if (amenityLower.contains('alarm') || amenityLower.contains('security')) {
      return Colors.green;
    }

    return Colors.grey.shade700;
  }
}

