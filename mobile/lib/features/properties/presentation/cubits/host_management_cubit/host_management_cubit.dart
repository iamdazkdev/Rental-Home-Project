import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../domain/usecases/listing_usecases.dart';
import 'host_management_state.dart';

@injectable
class HostManagementCubit extends Cubit<HostManagementState> {
  final ListingUseCases _listingUseCases;

  HostManagementCubit(this._listingUseCases) : super(HostManagementInitial());

  Future<void> fetchHostProperties(String hostId) async {
    emit(HostManagementLoading());
    try {
      final properties = await _listingUseCases.executeGetUserProperties(hostId);
      emit(HostPropertiesLoaded(properties));
    } catch (e) {
      emit(HostManagementError('Failed to fetch host properties: ${e.toString()}'));
    }
  }

  Future<void> createListing(
      Map<String, dynamic> listingData, List<String> imagePaths) async {
    emit(HostManagementLoading());
    try {
      final result =
          await _listingUseCases.executeCreateListing(listingData, imagePaths);
      if (result['success'] == true) {
        emit(HostActionSuccess('Listing created successfully', data: result['listing']));
      } else {
        emit(HostManagementError(result['message']));
      }
    } catch (e) {
      emit(HostManagementError('Failed to create listing: ${e.toString()}'));
    }
  }

  Future<void> updateListing(String listingId, Map<String, dynamic> listingData,
      List<String>? newImagePaths) async {
    emit(HostManagementLoading());
    try {
      final result = await _listingUseCases.executeUpdateListing(
          listingId, listingData, newImagePaths);
      if (result['success'] == true) {
        emit(const HostActionSuccess('Listing updated successfully'));
      } else {
        emit(HostManagementError(result['message']));
      }
    } catch (e) {
      emit(HostManagementError('Failed to update listing: ${e.toString()}'));
    }
  }

  Future<void> deleteListing(String listingId) async {
    emit(HostManagementLoading());
    try {
      final result = await _listingUseCases.executeDeleteListing(listingId);
      if (result['success'] == true) {
        emit(const HostActionSuccess('Listing deleted successfully'));
      } else {
        emit(HostManagementError(result['message']));
      }
    } catch (e) {
      emit(HostManagementError('Failed to delete listing: ${e.toString()}'));
    }
  }

  Future<void> toggleListingVisibility(
      String listingId, bool willBeHidden) async {
    emit(HostManagementLoading());
    try {
      final result = await _listingUseCases.executeToggleListingVisibility(
          listingId, willBeHidden);
      if (result['success'] == true) {
        emit(HostActionSuccess(result['message']));
      } else {
        emit(HostManagementError(result['message']));
      }
    } catch (e) {
      emit(HostManagementError('Failed to toggle visibility: ${e.toString()}'));
    }
  }
}
