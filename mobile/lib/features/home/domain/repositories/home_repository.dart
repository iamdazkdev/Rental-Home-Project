import '../../../../models/listing.dart';
import '../../../../models/roommate.dart';

abstract class IHomeRepository {
  Future<List<Listing>> getListings({String? category, String? type});
  Future<List<RoommatePost>> getRoommatePosts();
}
