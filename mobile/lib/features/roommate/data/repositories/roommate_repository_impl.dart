import 'package:injectable/injectable.dart';
import '../../domain/entities/roommate_entity.dart';
import '../../domain/repositories/i_roommate_repository.dart';
import '../datasources/roommate_remote_datasource.dart';

@LazySingleton(as: IRoommateRepository)
class RoommateRepositoryImpl implements IRoommateRepository {
  final RoommateRemoteDataSource remoteDataSource;

  RoommateRepositoryImpl(this.remoteDataSource);

  @override
  Future<List<RoommateEntity>> searchPosts({
    String? type,
    String? city,
    String? district,
    double? minBudget,
    double? maxBudget,
    String? genderPreference,
  }) async {
    return await remoteDataSource.searchPosts(
      type: type,
      city: city,
      district: district,
      minBudget: minBudget,
      maxBudget: maxBudget,
      genderPreference: genderPreference,
    );
  }

  @override
  Future<RoommateEntity?> getPostDetails(String postId) async {
    return await remoteDataSource.getPostDetails(postId);
  }

  @override
  Future<List<RoommateEntity>> getUserPosts(String userId) async {
    return await remoteDataSource.getUserPosts(userId);
  }

  @override
  Future<Map<String, dynamic>> createPost(
      Map<String, dynamic> postData, List<String> imagePaths) async {
    return await remoteDataSource.createPost(postData, imagePaths);
  }

  @override
  Future<Map<String, dynamic>> updatePost(
    String postId,
    Map<String, dynamic> postData,
    List<String>? newImagePaths,
  ) async {
    return await remoteDataSource.updatePost(postId, postData, newImagePaths);
  }

  @override
  Future<Map<String, dynamic>> deletePost(String postId) async {
    return await remoteDataSource.deletePost(postId);
  }

  @override
  Future<Map<String, dynamic>> matchPost(String postId, String matchedUserId) async {
    return await remoteDataSource.matchPost(postId, matchedUserId);
  }

  @override
  Future<Map<String, dynamic>> togglePostStatus(String postId, String newStatus) async {
    return await remoteDataSource.togglePostStatus(postId, newStatus);
  }

  @override
  Future<Map<String, dynamic>> sendRequest({
    required String postId,
    required String senderId,
    required String receiverId,
    required String message,
  }) async {
    return await remoteDataSource.sendRequest(
      postId: postId,
      senderId: senderId,
      receiverId: receiverId,
      message: message,
    );
  }

  @override
  Future<List<RoommateRequestEntity>> getMyRequests(String userId) async {
    return await remoteDataSource.getMyRequests(userId);
  }

  @override
  Future<Map<String, dynamic>> respondToRequest(String requestId, String status) async {
    return await remoteDataSource.respondToRequest(requestId, status);
  }
}
