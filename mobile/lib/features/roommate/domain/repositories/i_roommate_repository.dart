import '../entities/roommate_entity.dart';

abstract class IRoommateRepository {
  Future<List<RoommateEntity>> searchPosts({
    String? type,
    String? city,
    String? district,
    double? minBudget,
    double? maxBudget,
    String? genderPreference,
  });

  Future<RoommateEntity?> getPostDetails(String postId);

  Future<List<RoommateEntity>> getUserPosts(String userId);

  Future<Map<String, dynamic>> createPost(
      Map<String, dynamic> postData, List<String> imagePaths);

  Future<Map<String, dynamic>> updatePost(
    String postId,
    Map<String, dynamic> postData,
    List<String>? newImagePaths,
  );

  Future<Map<String, dynamic>> deletePost(String postId);

  Future<Map<String, dynamic>> matchPost(String postId, String matchedUserId);

  Future<Map<String, dynamic>> togglePostStatus(String postId, String newStatus);

  Future<Map<String, dynamic>> sendRequest({
    required String postId,
    required String senderId,
    required String receiverId,
    required String message,
  });

  Future<List<RoommateRequestEntity>> getMyRequests(String userId);

  Future<Map<String, dynamic>> respondToRequest(String requestId, String status);
}
