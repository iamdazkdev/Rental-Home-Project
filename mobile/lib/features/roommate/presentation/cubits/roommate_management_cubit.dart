import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';
import '../../domain/entities/roommate_entity.dart';
import '../../domain/usecases/roommate_usecases.dart';

abstract class RoommateManagementState extends Equatable {
  const RoommateManagementState();
  @override
  List<Object?> get props => [];
}

class RoommateManagementInitial extends RoommateManagementState {}

class RoommateManagementLoading extends RoommateManagementState {}

class RoommateUserPostsLoaded extends RoommateManagementState {
  final List<RoommateEntity> posts;
  const RoommateUserPostsLoaded(this.posts);
  @override
  List<Object?> get props => [posts];
}

class RoommateActionSuccess extends RoommateManagementState {
  final String message;
  const RoommateActionSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class RoommateManagementError extends RoommateManagementState {
  final String message;
  const RoommateManagementError(this.message);
  @override
  List<Object?> get props => [message];
}

@injectable
class RoommateManagementCubit extends Cubit<RoommateManagementState> {
  final RoommateUseCases _useCases;

  RoommateManagementCubit(this._useCases) : super(RoommateManagementInitial());

  Future<void> loadUserPosts(String userId) async {
    emit(RoommateManagementLoading());
    try {
      final posts = await _useCases.getUserPosts(userId);
      emit(RoommateUserPostsLoaded(posts));
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> createPost(Map<String, dynamic> data, List<String> images) async {
    emit(RoommateManagementLoading());
    try {
      final result = await _useCases.createPost(data, images);
      if (result['success'] == true) {
        emit(RoommateActionSuccess(result['message'] ?? 'Post created successfully'));
      } else {
        emit(RoommateManagementError(result['message'] ?? 'Failed to create post'));
      }
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> updatePost(String postId, Map<String, dynamic> data, List<String>? images) async {
    emit(RoommateManagementLoading());
    try {
      final result = await _useCases.updatePost(postId, data, images);
      if (result['success'] == true) {
        emit(RoommateActionSuccess(result['message'] ?? 'Post updated successfully'));
      } else {
        emit(RoommateManagementError(result['message'] ?? 'Failed to update post'));
      }
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> togglePostStatus(String postId, String currentStatus) async {
    emit(RoommateManagementLoading());
    try {
      final newStatus = currentStatus.toUpperCase() == 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      final result = await _useCases.togglePostStatus(postId, newStatus);
      if (result['success'] == true) {
        emit(RoommateActionSuccess(result['message'] ?? 'Status updated successfully'));
      } else {
        emit(RoommateManagementError(result['message'] ?? 'Failed to update status'));
      }
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> deletePost(String postId) async {
    emit(RoommateManagementLoading());
    try {
      final result = await _useCases.deletePost(postId);
      if (result['success'] == true) {
        emit(RoommateActionSuccess(result['message'] ?? 'Post deleted successfully'));
      } else {
        emit(RoommateManagementError(result['message'] ?? 'Failed to delete post'));
      }
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> loadMyRequests(String userId) async {
    emit(RoommateManagementLoading());
    try {
      final requests = await _useCases.getMyRequests(userId);
      emit(RoommateRequestsLoaded(requests));
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }

  Future<void> respondToRequest(String requestId, String status) async {
    emit(RoommateManagementLoading());
    try {
      final result = await _useCases.respondToRequest(requestId, status);
      if (result['success'] == true) {
        emit(RoommateActionSuccess(result['message'] ?? 'Request updated'));
      } else {
        emit(RoommateManagementError(result['message'] ?? 'Failed to update request'));
      }
    } catch (e) {
      emit(RoommateManagementError(e.toString()));
    }
  }
}

class RoommateRequestsLoaded extends RoommateManagementState {
  final List<RoommateRequestEntity> requests;

  const RoommateRequestsLoaded(this.requests);

  @override
  List<Object> get props => [requests];
}
