import 'package:injectable/injectable.dart';

import '../../domain/entities/listing_entity.dart';
import '../../domain/repositories/i_listing_repository.dart';
import '../datasources/listing_remote_datasource.dart';

@LazySingleton(as: IListingRepository)
class ListingRepositoryImpl implements IListingRepository {
  final ListingRemoteDataSource remoteDataSource;

  ListingRepositoryImpl(this.remoteDataSource);

  @override
  Future<List<ListingEntity>> getListings({String? category}) {
    return remoteDataSource.getListings(category: category);
  }

  @override
  Future<ListingEntity?> getListingDetails(String listingId) {
    return remoteDataSource.getListingDetails(listingId);
  }

  @override
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
  }) {
    return remoteDataSource.searchListings(
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

  @override
  Future<List<ListingEntity>> getUserProperties(String userId) {
    return remoteDataSource.getUserProperties(userId);
  }

  @override
  Future<Map<String, dynamic>> createListing(
      Map<String, dynamic> listingData, List<String> imagePaths) {
    return remoteDataSource.createListing(listingData, imagePaths);
  }

  @override
  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> listingData,
    List<String>? newImagePaths,
  ) {
    return remoteDataSource.updateListing(
      listingId,
      listingData,
      newImagePaths,
    );
  }

  @override
  Future<Map<String, dynamic>> deleteListing(String listingId) {
    return remoteDataSource.deleteListing(listingId);
  }

  @override
  Future<Map<String, dynamic>> toggleListingVisibility(
      String listingId, bool willBeHidden) {
    return remoteDataSource.toggleListingVisibility(listingId, willBeHidden);
  }

  @override
  Future<bool> updateListingStatus(String listingId, bool isActive) {
    return remoteDataSource.updateListingStatus(listingId, isActive);
  }
}
