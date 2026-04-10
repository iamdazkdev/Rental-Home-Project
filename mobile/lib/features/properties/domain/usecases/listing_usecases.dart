import 'package:injectable/injectable.dart';

import 'entities/listing_entity.dart';
import 'repositories/i_listing_repository.dart';

@injectable
class ListingUseCases {
  final IListingRepository repository;

  ListingUseCases(this.repository);

  Future<List<ListingEntity>> executeGetListings({String? category}) {
    return repository.getListings(category: category);
  }

  Future<ListingEntity?> executeGetListingDetails(String listingId) {
    return repository.getListingDetails(listingId);
  }

  Future<List<ListingEntity>> executeSearchListings({
    String? query,
    String? category,
    String? type,
    double? minPrice,
    double? maxPrice,
    int? minGuests,
    int? minBedrooms,
    int? minBathrooms,
    List<String>? amenities,
  }) {
    return repository.searchListings(
      query: query,
      category: category,
      type: type,
      minPrice: minPrice,
      maxPrice: maxPrice,
      minGuests: minGuests,
      minBedrooms: minBedrooms,
      minBathrooms: minBathrooms,
      amenities: amenities,
    );
  }

  Future<List<ListingEntity>> executeGetUserProperties(String userId) {
    return repository.getUserProperties(userId);
  }

  Future<Map<String, dynamic>> executeCreateListing(
      Map<String, dynamic> listingData, List<String> imagePaths) {
    return repository.createListing(listingData, imagePaths);
  }

  Future<Map<String, dynamic>> executeUpdateListing(
    String listingId,
    Map<String, dynamic> listingData,
    List<String>? newImagePaths,
  ) {
    return repository.updateListing(listingId, listingData, newImagePaths);
  }

  Future<Map<String, dynamic>> executeDeleteListing(String listingId) {
    return repository.deleteListing(listingId);
  }

  Future<Map<String, dynamic>> executeToggleListingVisibility(
      String listingId, bool willBeHidden) {
    return repository.toggleListingVisibility(listingId, willBeHidden);
  }

  Future<bool> executeUpdateListingStatus(String listingId, bool isActive) {
    return repository.updateListingStatus(listingId, isActive);
  }
}
