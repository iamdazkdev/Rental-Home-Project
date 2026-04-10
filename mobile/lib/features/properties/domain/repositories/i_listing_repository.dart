import 'listing_entity.dart';

abstract class IListingRepository {
  Future<List<ListingEntity>> getListings({String? category});
  
  Future<ListingEntity?> getListingDetails(String listingId);
  
  Future<List<ListingEntity>> searchListings({
    String? query,
    String? category,
    String? type,
    double? minPrice,
    double? maxPrice,
    int? minGuests,
    int? minBedrooms,
    int? minBathrooms,
    List<String>? amenities,
  });

  Future<List<ListingEntity>> getUserProperties(String userId);
  
  Future<Map<String, dynamic>> createListing(
      Map<String, dynamic> listingData, List<String> imagePaths);
      
  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> listingData,
    List<String>? newImagePaths,
  );
  
  Future<Map<String, dynamic>> deleteListing(String listingId);
  
  Future<Map<String, dynamic>> toggleListingVisibility(String listingId, bool willBeHidden);
  
  Future<bool> updateListingStatus(String listingId, bool isActive);
}
