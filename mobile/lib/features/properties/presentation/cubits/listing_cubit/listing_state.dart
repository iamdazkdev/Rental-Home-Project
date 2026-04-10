import 'package:equatable/equatable.dart';

import '../../../domain/entities/listing_entity.dart';

abstract class ListingState extends Equatable {
  const ListingState();

  @override
  List<Object?> get props => [];
}

class ListingInitial extends ListingState {}

class ListingLoading extends ListingState {}

class ListingsLoaded extends ListingState {
  final List<ListingEntity> listings;

  const ListingsLoaded(this.listings);

  @override
  List<Object?> get props => [listings];
}

class ListingDetailsLoaded extends ListingState {
  final ListingEntity listing;

  const ListingDetailsLoaded(this.listing);

  @override
  List<Object?> get props => [listing];
}

class ListingError extends ListingState {
  final String message;

  const ListingError(this.message);

  @override
  List<Object?> get props => [message];
}
