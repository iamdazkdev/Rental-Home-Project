import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../domain/usecases/home_usecases.dart';
import '../../../../../models/listing.dart';
import '../../../../../models/roommate.dart';

part 'home_state.dart';

@injectable
class HomeCubit extends Cubit<HomeState> {
  final GetListingsUseCase _getListingsUseCase;
  final GetRoommatePostsUseCase _getRoommatePostsUseCase;

  String _currentCategory = 'All';
  String? _currentType;

  HomeCubit(this._getListingsUseCase, this._getRoommatePostsUseCase) 
    : super(HomeInitial());

  String get currentCategory => _currentCategory;
  String? get currentType => _currentType;

  void setFilter(String category, String? type, {String? currentUserId}) {
    _currentCategory = category;
    _currentType = type;
    loadData(currentUserId: currentUserId);
  }

  Future<void> loadData({String? currentUserId}) async {
    emit(HomeLoading());
    try {
      if (_currentType == 'A Shared Room') {
        List<RoommatePost> posts = await _getRoommatePostsUseCase();
        if (currentUserId != null) {
          posts = posts.where((post) => post.userId != currentUserId).toList();
        }
        emit(HomeRoommatesLoaded(posts));
      } else {
        List<Listing> listings = await _getListingsUseCase(
          category: _currentCategory == 'All' ? null : _currentCategory,
          type: _currentType,
        );
        if (currentUserId != null) {
          listings = listings.where((listing) => listing.creator != currentUserId).toList();
        }
        emit(HomeListingsLoaded(listings));
      }
    } catch (e) {
      emit(HomeError(e.toString()));
    }
  }
}
