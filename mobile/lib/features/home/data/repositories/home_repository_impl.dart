import 'package:injectable/injectable.dart';
import '../../../../services/listing_service.dart';
import '../../../../services/roommate_service.dart';
import '../../domain/repositories/home_repository.dart';
import '../../../../models/listing.dart';
import '../../../../models/roommate.dart';

@LazySingleton(as: IHomeRepository)
class HomeRepositoryImpl implements IHomeRepository {
  final ListingService _listingService;
  final RoommateService _roommateService;

  HomeRepositoryImpl() 
    : _listingService = ListingService(),
      _roommateService = RoommateService();

  @override
  Future<List<Listing>> getListings({String? category, String? type}) async {
    List<Listing> listings = await _listingService.getListings(category: category);
    if (type != null && type != 'A Shared Room') {
      listings = listings.where((listing) => listing.type == type).toList();
    }
    return listings;
  }

  @override
  Future<List<RoommatePost>> getRoommatePosts() async {
    return await _roommateService.searchPosts();
  }
}
