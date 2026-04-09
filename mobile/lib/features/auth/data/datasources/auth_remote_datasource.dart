import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:injectable/injectable.dart';
import '../../../../config/api_config.dart';
import '../models/user_model.dart';

abstract class IAuthRemoteDataSource {
  Future<UserModel> login(String email, String password);
  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? profileImage,
  });
}

@LazySingleton(as: IAuthRemoteDataSource)
class AuthRemoteDataSourceImpl implements IAuthRemoteDataSource {
  @override
  Future<UserModel> login(String email, String password) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.login}');
    final response = await http.post(
      uri,
      headers: ApiConfig.headers(),
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['user'] != null) {
        return UserModel.fromJson(data['user']);
        // Note: Token and User storage will be handled by Repository
      }
      throw Exception('User data not found in response');
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Login failed');
    }
  }

  @override
  Future<UserModel> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? profileImage,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.register}');
    var request = http.MultipartRequest('POST', uri);
    request.fields['firstName'] = firstName;
    request.fields['lastName'] = lastName;
    request.fields['email'] = email;
    request.fields['password'] = password;
    request.fields['confirmPassword'] = password;

    if (profileImage != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'profileImage',
        profileImage,
      ));
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = json.decode(response.body);
      return UserModel.fromJson(data['user']);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Registration failed');
    }
  }
}
