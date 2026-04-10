import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:injectable/injectable.dart';

import '../../../../config/api_config.dart';
import '../../../../services/storage_service.dart';
import '../models/listing_model.dart';

abstract class ListingRemoteDataSource {
  Future<List<ListingModel>> getListings({String? category});
  Future<ListingModel?> getListingDetails(String listingId);
  Future<List<ListingModel>> searchListings({
    String? query,
    String? category,
    String? type,
    double? minPrice,
    double? maxPrice,
    int? minGuests,
    int? minBedrooms,
    int? minBathrooms,
    List<String>? amenities,
  });
  Future<List<ListingModel>> getUserProperties(String userId);
  Future<Map<String, dynamic>> createListing(
      Map<String, dynamic> listingData, List<String> imagePaths);
  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> listingData,
    List<String>? newImagePaths,
  );
  Future<Map<String, dynamic>> deleteListing(String listingId);
  Future<Map<String, dynamic>> toggleListingVisibility(
      String listingId, bool willBeHidden);
  Future<bool> updateListingStatus(String listingId, bool isActive);
}

@LazySingleton(as: ListingRemoteDataSource)
class ListingRemoteDataSourceImpl implements ListingRemoteDataSource {
  // Using GetIt injected or just instantiated StorageService as we did in Auth
  final StorageService _storageService = StorageService();

  @override
  Future<List<ListingModel>> getListings({String? category}) async {
    try {
      String url = '${ApiConfig.baseUrl}${ApiConfig.listings}';
      if (category != null && category != 'All') {
        url += '?category=$category';
      }

      final uri = Uri.parse(url);
      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => ListingModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching listings: $e');
      return [];
    }
  }

  @override
  Future<ListingModel?> getListingDetails(String listingId) async {
    try {
      final uri =
          Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listingDetails}/$listingId');
      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return ListingModel.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching listing details: $e');
      return null;
    }
  }

  @override
  Future<List<ListingModel>> searchListings({
    String? query,
    String? category,
    String? type,
    double? minPrice,
    double? maxPrice,
    int? minGuests,
    int? minBedrooms,
    int? minBathrooms,
    List<String>? amenities,
  }) async {
    try {
      final Map<String, dynamic> params = {};

      if (query != null && query.isNotEmpty) params['query'] = query;
      if (category != null && category != 'All') params['category'] = category;
      if (type != null) params['type'] = type;
      if (minPrice != null && minPrice > 0) {
        params['minPrice'] = minPrice.toString();
      }
      if (maxPrice != null && maxPrice < 10000) {
        params['maxPrice'] = maxPrice.toString();
      }
      if (minGuests != null && minGuests > 0) {
        params['minGuests'] = minGuests.toString();
      }
      if (minBedrooms != null && minBedrooms > 0) {
        params['minBedrooms'] = minBedrooms.toString();
      }
      if (minBathrooms != null && minBathrooms > 0) {
        params['minBathrooms'] = minBathrooms.toString();
      }
      if (amenities != null && amenities.isNotEmpty) {
        params['amenities'] = amenities.join(',');
      }

      final queryParams = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
          .join('&');

      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.search}${queryParams.isNotEmpty ? '?$queryParams' : ''}');

      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> listings = data['listings'] ?? data;
        return listings.map((json) => ListingModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error searching listings: $e');
      return [];
    }
  }

  @override
  Future<List<ListingModel>> getUserProperties(String userId) async {
    try {
      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.properties}/$userId/properties?includeHidden=true');
      final token = await _storageService.getToken();

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => ListingModel.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching user properties: $e');
      return [];
    }
  }

  @override
  Future<Map<String, dynamic>> createListing(
      Map<String, dynamic> listingData, List<String> imagePaths) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/create');
      var request = http.MultipartRequest('POST', uri);
      request.headers.addAll(ApiConfig.multipartHeaders(token: token));

      listingData.forEach((key, value) {
        if (value is List) {
          request.fields[key] = json.encode(value);
        } else {
          request.fields[key] = value.toString();
        }
      });

      for (var imagePath in imagePaths) {
        request.files
            .add(await http.MultipartFile.fromPath('listingPhotos', imagePath));
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': 'Listing created successfully',
          'listing': data,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to create listing',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  @override
  Future<Map<String, dynamic>> updateListing(
    String listingId,
    Map<String, dynamic> listingData,
    List<String>? newImagePaths,
  ) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri =
          Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/$listingId');
      var request = http.MultipartRequest('PUT', uri);
      request.headers.addAll(ApiConfig.multipartHeaders(token: token));

      listingData.forEach((key, value) {
        if (value is List) {
          request.fields[key] = json.encode(value);
        } else {
          request.fields[key] = value.toString();
        }
      });

      if (newImagePaths != null) {
        for (var imagePath in newImagePaths) {
          request.files.add(
              await http.MultipartFile.fromPath('listingPhotos', imagePath));
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Listing updated successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update listing',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  @override
  Future<Map<String, dynamic>> deleteListing(String listingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri =
          Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/$listingId');
      final response = await http.delete(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Listing deleted successfully',
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to delete listing',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  @override
  Future<Map<String, dynamic>> toggleListingVisibility(
      String listingId, bool willBeHidden) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse(
          '${ApiConfig.baseUrl}${ApiConfig.properties}/$listingId/toggle-visibility');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ??
              (willBeHidden ? 'Listing hidden' : 'Listing visible'),
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update visibility',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  @override
  Future<bool> updateListingStatus(String listingId, bool isActive) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return false;

      final uri = Uri.parse('${ApiConfig.baseUrl}/listing/$listingId/status');

      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'isActive': isActive}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating listing status: $e');
      return false;
    }
  }
}
