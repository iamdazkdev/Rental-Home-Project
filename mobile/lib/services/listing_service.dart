import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/listing.dart';
import 'storage_service.dart';

class ListingService {
  final StorageService _storageService = StorageService();

  // Get all listings
  Future<List<Listing>> getListings({String? category}) async {
    try {
      String url = '${ApiConfig.baseUrl}${ApiConfig.listings}';
      if (category != null && category != 'All') {
        url += '?category=$category';
      }

      debugPrint('🔍 Fetching listings from: $url');

      final uri = Uri.parse(url);
      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Response status: ${response.statusCode}');
      debugPrint('📦 Response body: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Parsed ${data.length} listings');
        return data.map((json) => Listing.fromJson(json)).toList();
      }

      debugPrint('❌ Failed to fetch listings: ${response.statusCode}');
      return [];
    } catch (e) {
      debugPrint('❌ Error fetching listings: $e');
      return [];
    }
  }

  // Get listing details
  Future<Listing?> getListingDetails(String listingId) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listingDetails}/$listingId');
      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Listing.fromJson(data);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching listing details: $e');
      return null;
    }
  }

  // Search listings
  Future<List<Listing>> searchListings(Map<String, dynamic> filters) async {
    try {
      final queryParams = filters.entries
          .where((e) => e.value != null && e.value.toString().isNotEmpty)
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
          .join('&');

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.search}?$queryParams');
      final response = await http.get(uri, headers: ApiConfig.headers());

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> listings = data['listings'] ?? data;
        return listings.map((json) => Listing.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error searching listings: $e');
      return [];
    }
  }

  // Create listing
  Future<Map<String, dynamic>> createListing(Map<String, dynamic> listingData, List<String> imagePaths) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/create');
      var request = http.MultipartRequest('POST', uri);
      request.headers.addAll(ApiConfig.multipartHeaders(token: token));

      // Add fields
      listingData.forEach((key, value) {
        if (value is List) {
          request.fields[key] = json.encode(value);
        } else {
          request.fields[key] = value.toString();
        }
      });

      // Add images
      for (var imagePath in imagePaths) {
        request.files.add(await http.MultipartFile.fromPath('listingPhotos', imagePath));
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

  // Update listing
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

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/$listingId');
      var request = http.MultipartRequest('PUT', uri);
      request.headers.addAll(ApiConfig.multipartHeaders(token: token));

      // Add fields
      listingData.forEach((key, value) {
        if (value is List) {
          request.fields[key] = json.encode(value);
        } else {
          request.fields[key] = value.toString();
        }
      });

      // Add new images if any
      if (newImagePaths != null) {
        for (var imagePath in newImagePaths) {
          request.files.add(await http.MultipartFile.fromPath('listingPhotos', imagePath));
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

  // Delete listing
  Future<Map<String, dynamic>> deleteListing(String listingId) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.listings}/$listingId');
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

  // Toggle listing visibility
  Future<Map<String, dynamic>> toggleListingVisibility(String listingId, bool isHidden) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.propertyManagement}/$listingId/visibility');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
        body: json.encode({'isHidden': isHidden}),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': isHidden ? 'Listing hidden' : 'Listing visible',
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
}

