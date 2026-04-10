import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../domain/usecases/listing_usecases.dart';
import 'listing_state.dart';

@injectable
class ListingCubit extends Cubit<ListingState> {
  final ListingUseCases _listingUseCases;

  ListingCubit(this._listingUseCases) : super(ListingInitial());

  Future<void> fetchListings({String? category}) async {
    emit(ListingLoading());
    try {
      final listings =
          await _listingUseCases.executeGetListings(category: category);
      emit(ListingsLoaded(listings));
    } catch (e) {
      emit(ListingError('Failed to fetch listings: ${e.toString()}'));
    }
  }

  Future<void> searchListings({
    String? query,
    String? category,
    String? type,
    double? minPrice,
    double? maxPrice,
    int? minGuests,
    int? minBedrooms,
    int? minBathrooms,
    List<String>? amenities,
  }) async {
    emit(ListingLoading());
    try {
      final listings = await _listingUseCases.executeSearchListings(
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
      emit(ListingsLoaded(listings));
    } catch (e) {
      emit(ListingError('Failed to search listings: ${e.toString()}'));
    }
  }

  Future<void> getListingDetails(String listingId) async {
    emit(ListingLoading());
    try {
      final listing =
          await _listingUseCases.executeGetListingDetails(listingId);
      if (listing != null) {
        emit(ListingDetailsLoaded(listing));
      } else {
        emit(const ListingError('Listing not found'));
      }
    } catch (e) {
      emit(ListingError('Failed to load listing details: ${e.toString()}'));
    }
  }
}
