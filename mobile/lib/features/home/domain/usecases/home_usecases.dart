import 'package:injectable/injectable.dart';
import '../repositories/home_repository.dart';
import '../../../../models/listing.dart';
import '../../../../models/roommate.dart';

@injectable
class GetListingsUseCase {
  final IHomeRepository repository;
  GetListingsUseCase(this.repository);

  Future<List<Listing>> call({String? category, String? type}) {
    return repository.getListings(category: category, type: type);
  }
}

@injectable
class GetRoommatePostsUseCase {
  final IHomeRepository repository;
  GetRoommatePostsUseCase(this.repository);

  Future<List<RoommatePost>> call() {
    return repository.getRoommatePosts();
  }
}
