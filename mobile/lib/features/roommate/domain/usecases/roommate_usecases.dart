import 'package:injectable/injectable.dart';
import '../entities/roommate_entity.dart';
import '../repositories/i_roommate_repository.dart';

@injectable
class RoommateUseCases {
  final IRoommateRepository _repository;

  RoommateUseCases(this._repository);

  Future<List<RoommateEntity>> searchPosts({
    String? type,
    String? city,
    String? district,
    double? minBudget,
    double? maxBudget,
    String? genderPreference,
  }) {
    return _repository.searchPosts(
      type: type,
      city: city,
      district: district,
      minBudget: minBudget,
      maxBudget: maxBudget,
      genderPreference: genderPreference,
    );
  }

  Future<RoommateEntity?> getPostDetails(String postId) {
    return _repository.getPostDetails(postId);
  }

  Future<List<RoommateEntity>> getUserPosts(String userId) {
    return _repository.getUserPosts(userId);
  }

  Future<Map<String, dynamic>> createPost(
      Map<String, dynamic> postData, List<String> imagePaths) {
    return _repository.createPost(postData, imagePaths);
  }

  Future<Map<String, dynamic>> updatePost(
    String postId,
    Map<String, dynamic> postData,
    List<String>? newImagePaths,
  ) {
    return _repository.updatePost(postId, postData, newImagePaths);
  }

  Future<Map<String, dynamic>> deletePost(String postId) {
    return _repository.deletePost(postId);
  }

  Future<Map<String, dynamic>> matchPost(String postId, String matchedUserId) {
    return _repository.matchPost(postId, matchedUserId);
  }

  Future<Map<String, dynamic>> togglePostStatus(String postId, String newStatus) {
    return _repository.togglePostStatus(postId, newStatus);
  }

  Future<Map<String, dynamic>> sendRequest({
    required String postId,
    required String senderId,
    required String receiverId,
    required String message,
  }) {
    return _repository.sendRequest(
      postId: postId,
      senderId: senderId,
      receiverId: receiverId,
      message: message,
    );
  }

  Future<List<RoommateRequestEntity>> getMyRequests(String userId) {
    return _repository.getMyRequests(userId);
  }

  Future<Map<String, dynamic>> respondToRequest(String requestId, String status) {
    return _repository.respondToRequest(requestId, status);
  }
}
