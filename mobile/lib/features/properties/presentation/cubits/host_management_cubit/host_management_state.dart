import 'package:equatable/equatable.dart';

import '../../../domain/entities/listing_entity.dart';

abstract class HostManagementState extends Equatable {
  const HostManagementState();

  @override
  List<Object?> get props => [];
}

class HostManagementInitial extends HostManagementState {}

class HostManagementLoading extends HostManagementState {}

class HostPropertiesLoaded extends HostManagementState {
  final List<ListingEntity> properties;

  const HostPropertiesLoaded(this.properties);

  @override
  List<Object?> get props => [properties];
}

class HostActionSuccess extends HostManagementState {
  final String message;
  final dynamic data;

  const HostActionSuccess(this.message, {this.data});

  @override
  List<Object?> get props => [message, data];
}

class HostManagementError extends HostManagementState {
  final String message;

  const HostManagementError(this.message);

  @override
  List<Object?> get props => [message];
}
