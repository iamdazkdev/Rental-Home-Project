import 'package:equatable/equatable.dart';
import '../../models/listing.dart';

/// ListingModel for state management (BLoC/Cubit)
/// Immutable model with Equatable for efficient state comparison
class ListingModel extends Equatable {
  final String id;
  final String creator;
  final String category;
  final String type;
  final String streetAddress;
  final String aptSuite;
  final String city;
  final String province;
  final String country;
  final int guestCount;
  final int bedroomCount;
  final int bedCount;
  final int bathroomCount;
  final List<String> amenities;
  final List<String> listingPhotoPaths;
  final String title;
  final String description;
  final String highlight;
  final String highlightDesc;
  final double price;
  final String? priceType;
  final bool isAvailable;
  final bool isHidden;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final double? roomArea;

  final Map<String, dynamic>? creatorData;
  final Map<String, dynamic>? hostProfile;

  // Add hostId getter
  String get hostId => creator;

  const ListingModel({
    required this.id,
    required this.creator,
    required this.category,
    required this.type,
    required this.streetAddress,
    required this.aptSuite,
    required this.city,
    required this.province,
    required this.country,
    required this.guestCount,
    required this.bedroomCount,
    required this.bedCount,
    required this.bathroomCount,
    required this.amenities,
    required this.listingPhotoPaths,
    required this.title,
    required this.description,
    required this.highlight,
    required this.highlightDesc,
    required this.price,
    this.priceType,
    this.isAvailable = true,
    this.isHidden = false,
    this.creatorData,
    this.hostProfile,
    this.createdAt,
    this.updatedAt,
    this.roomArea,
  });

  // Convert from Listing to ListingModel
  factory ListingModel.fromListing(Listing listing) {
    return ListingModel(
      id: listing.id,
      creator: listing.creator,
      category: listing.category,
      type: listing.type,
      streetAddress: listing.streetAddress,
      aptSuite: listing.aptSuite,
      city: listing.city,
      province: listing.province,
      country: listing.country,
      guestCount: listing.guestCount,
      bedroomCount: listing.bedroomCount,
      bedCount: listing.bedCount,
      bathroomCount: listing.bathroomCount,
      amenities: listing.amenities,
      listingPhotoPaths: listing.listingPhotoPaths,
      title: listing.title,
      description: listing.description,
      highlight: listing.highlight,
      highlightDesc: listing.highlightDesc,
      price: listing.price,
      priceType: listing.priceType,
      isAvailable: listing.isAvailable,
      isHidden: listing.isHidden,
      creatorData: listing.creatorData,
      hostProfile: listing.hostProfile,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      roomArea: listing.roomArea,
    );
  }

  // Convert to Listing (if needed)
  Listing toListing() {
    return Listing(
      id: id,
      creator: creator,
      category: category,
      type: type,
      streetAddress: streetAddress,
      aptSuite: aptSuite,
      city: city,
      province: province,
      country: country,
      guestCount: guestCount,
      bedroomCount: bedroomCount,
      bedCount: bedCount,
      bathroomCount: bathroomCount,
      amenities: amenities,
      listingPhotoPaths: listingPhotoPaths,
      title: title,
      description: description,
      highlight: highlight,
      highlightDesc: highlightDesc,
      price: price,
      priceType: priceType,
      isAvailable: isAvailable,
      isHidden: isHidden,
      creatorData: creatorData,
      hostProfile: hostProfile,
      createdAt: createdAt,
      updatedAt: updatedAt,
      roomArea: roomArea,
    );
  }

  @override
  List<Object?> get props => [
        id,
        creator,
        category,
        type,
        streetAddress,
        aptSuite,
        city,
        province,
        country,
        guestCount,
        bedroomCount,
        bedCount,
        bathroomCount,
        amenities,
        listingPhotoPaths,
        title,
        description,
        highlight,
        highlightDesc,
        price,
        priceType,
        isAvailable,
        isHidden,
        createdAt,
        updatedAt,
        roomArea,
      ];

  ListingModel copyWith({
    String? id,
    String? creator,
    String? category,
    String? type,
    String? streetAddress,
    String? aptSuite,
    String? city,
    String? province,
    String? country,
    int? guestCount,
    int? bedroomCount,
    int? bedCount,
    int? bathroomCount,
    List<String>? amenities,
    List<String>? listingPhotoPaths,
    String? title,
    String? description,
    String? highlight,
    String? highlightDesc,
    double? price,
    String? priceType,
    bool? isAvailable,
    bool? isHidden,
    Map<String, dynamic>? creatorData,
    Map<String, dynamic>? hostProfile,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? roomArea,
  }) {
    return ListingModel(
      id: id ?? this.id,
      creator: creator ?? this.creator,
      category: category ?? this.category,
      type: type ?? this.type,
      streetAddress: streetAddress ?? this.streetAddress,
      aptSuite: aptSuite ?? this.aptSuite,
      city: city ?? this.city,
      province: province ?? this.province,
      country: country ?? this.country,
      guestCount: guestCount ?? this.guestCount,
      bedroomCount: bedroomCount ?? this.bedroomCount,
      bedCount: bedCount ?? this.bedCount,
      bathroomCount: bathroomCount ?? this.bathroomCount,
      amenities: amenities ?? this.amenities,
      listingPhotoPaths: listingPhotoPaths ?? this.listingPhotoPaths,
      title: title ?? this.title,
      description: description ?? this.description,
      highlight: highlight ?? this.highlight,
      highlightDesc: highlightDesc ?? this.highlightDesc,
      price: price ?? this.price,
      priceType: priceType ?? this.priceType,
      isAvailable: isAvailable ?? this.isAvailable,
      isHidden: isHidden ?? this.isHidden,
      creatorData: creatorData ?? this.creatorData,
      hostProfile: hostProfile ?? this.hostProfile,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      roomArea: roomArea ?? this.roomArea,
    );
  }
}

