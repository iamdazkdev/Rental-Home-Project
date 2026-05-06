import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/roommate_entity.dart';
import '../../domain/usecases/roommate_usecases.dart';

abstract class RoommateSearchState extends Equatable {
  const RoommateSearchState();
  @override
  List<Object?> get props => [];
}

class RoommateSearchInitial extends RoommateSearchState {}

class RoommateSearchLoading extends RoommateSearchState {}

class RoommateSearchLoaded extends RoommateSearchState {
  final List<RoommateEntity> posts;
  const RoommateSearchLoaded(this.posts);
  @override
  List<Object?> get props => [posts];
}

class RoommatePostDetailsLoaded extends RoommateSearchState {
  final RoommateEntity post;
  const RoommatePostDetailsLoaded(this.post);
  @override
  List<Object?> get props => [post];
}

class RoommateSearchError extends RoommateSearchState {
  final String message;
  const RoommateSearchError(this.message);
  @override
  List<Object?> get props => [message];
}

@injectable
class RoommateSearchCubit extends Cubit<RoommateSearchState> {
  final RoommateUseCases _useCases;

  RoommateSearchCubit(this._useCases) : super(RoommateSearchInitial());

  Future<void> searchPosts({
    String? type,
    String? city,
    String? district,
    double? minBudget,
    double? maxBudget,
    String? genderPreference,
  }) async {
    emit(RoommateSearchLoading());
    try {
      final posts = await _useCases.searchPosts(
        type: type,
        city: city,
        district: district,
        minBudget: minBudget,
        maxBudget: maxBudget,
        genderPreference: genderPreference,
      );
      emit(RoommateSearchLoaded(posts));
    } catch (e) {
      emit(RoommateSearchError(e.toString()));
    }
  }

  Future<void> getPostDetails(String postId) async {
    emit(RoommateSearchLoading());
    try {
      final post = await _useCases.getPostDetails(postId);
      if (post != null) {
        emit(RoommatePostDetailsLoaded(post));
      } else {
        emit(const RoommateSearchError("Post not found"));
      }
    } catch (e) {
      emit(RoommateSearchError(e.toString()));
    }
  }
}
