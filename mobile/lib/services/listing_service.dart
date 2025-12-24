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
  Future<List<Listing>> searchListings({
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
      // Build query parameters
      final Map<String, dynamic> params = {};

      if (query != null && query.isNotEmpty) params['query'] = query;
      if (category != null && category != 'All') params['category'] = category;
      if (type != null) params['type'] = type;
      if (minPrice != null && minPrice > 0) params['minPrice'] = minPrice.toString();
      if (maxPrice != null && maxPrice < 10000) params['maxPrice'] = maxPrice.toString();
      if (minGuests != null && minGuests > 0) params['minGuests'] = minGuests.toString();
      if (minBedrooms != null && minBedrooms > 0) params['minBedrooms'] = minBedrooms.toString();
      if (minBathrooms != null && minBathrooms > 0) params['minBathrooms'] = minBathrooms.toString();
      if (amenities != null && amenities.isNotEmpty) {
        params['amenities'] = amenities.join(',');
      }

      final queryParams = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value.toString())}')
          .join('&');

      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.search}${queryParams.isNotEmpty ? '?$queryParams' : ''}');

      debugPrint('🔍 Search URL: $uri');

      final response = await http.get(uri, headers: ApiConfig.headers());

      debugPrint('📥 Search response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> listings = data['listings'] ?? data;
        debugPrint('✅ Found ${listings.length} results');
        return listings.map((json) => Listing.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('❌ Error searching listings: $e');
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
  Future<Map<String, dynamic>> toggleListingVisibility(String listingId, bool willBeHidden) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      // PATCH /properties/:listingId/toggle-visibility
      // Backend toggles isActive automatically (no body needed)
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.properties}/$listingId/toggle-visibility');
      final response = await http.patch(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('🔍 Toggle visibility URL: $uri');
      debugPrint('📥 Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('✅ Visibility toggled: ${data['message']}');
        return {
          'success': true,
          'message': data['message'] ?? (willBeHidden ? 'Listing hidden' : 'Listing visible'),
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'message': error['message'] ?? 'Failed to update visibility',
        };
      }
    } catch (e) {
      debugPrint('❌ Error toggling visibility: $e');
      return {
        'success': false,
        'message': 'An error occurred: ${e.toString()}',
      };
    }
  }

  // Get user's properties
  Future<List<Listing>> getUserProperties(String userId) async {
    try {
      // Include hidden properties by adding query parameter
      final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.properties}/$userId/properties?includeHidden=true');
      final token = await _storageService.getToken();

      debugPrint('🔍 Fetching user properties: $uri');

      final response = await http.get(
        uri,
        headers: ApiConfig.headers(token: token),
      );

      debugPrint('📥 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        debugPrint('✅ Found ${data.length} properties');

        // Debug log to check isHidden status
        for (var item in data) {
          debugPrint('  Property: ${item['title']}, isHidden: ${item['isHidden']}, isActive: ${item['isActive']}');
        }

        return data.map((json) => Listing.fromJson(json)).toList();
      }

      return [];
    } catch (e) {
      debugPrint('❌ Error fetching user properties: $e');
      return [];
    }
  }
}
