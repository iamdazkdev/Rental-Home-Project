part of 'home_cubit.dart';

abstract class HomeState extends Equatable {
  const HomeState();

  @override
  List<Object> get props => [];
}

class HomeInitial extends HomeState {}

class HomeLoading extends HomeState {}

class HomeListingsLoaded extends HomeState {
  final List<Listing> listings;

  const HomeListingsLoaded(this.listings);

  @override
  List<Object> get props => [listings];
}

class HomeRoommatesLoaded extends HomeState {
  final List<RoommatePost> posts;

  const HomeRoommatesLoaded(this.posts);

  @override
  List<Object> get props => [posts];
}

class HomeError extends HomeState {
  final String message;

  const HomeError(this.message);

  @override
  List<Object> get props => [message];
}
