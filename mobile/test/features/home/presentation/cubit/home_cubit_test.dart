import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:rental_home/features/home/domain/usecases/home_usecases.dart';
import 'package:rental_home/features/home/presentation/cubit/home_cubit.dart';
import 'package:rental_home/models/listing.dart';
import 'package:rental_home/models/roommate.dart';

class MockGetListingsUseCase extends Mock implements GetListingsUseCase {}
class MockGetRoommatePostsUseCase extends Mock implements GetRoommatePostsUseCase {}

void main() {
  late MockGetListingsUseCase mockGetListingsUseCase;
  late MockGetRoommatePostsUseCase mockGetRoommatePostsUseCase;
  late HomeCubit homeCubit;

  setUp(() {
    mockGetListingsUseCase = MockGetListingsUseCase();
    mockGetRoommatePostsUseCase = MockGetRoommatePostsUseCase();
    homeCubit = HomeCubit(mockGetListingsUseCase, mockGetRoommatePostsUseCase);
  });

  tearDown(() {
    homeCubit.close();
  });

  group('HomeCubit', () {
    test('initial state is HomeInitial', () {
      expect(homeCubit.state, isA<HomeInitial>());
      expect(homeCubit.currentCategory, 'All');
      expect(homeCubit.currentType, isNull);
    });

    test('emits [HomeLoading, HomeListingsLoaded] when loadData is called for standard listings', () async {
      final listings = [
        Listing(
          id: '1', title: 'Test House', category: 'House', type: 'Entire Place',
          creator: 'host1', streetAddress: '123', aptSuite: '', city: 'NY',
          province: 'NY', country: 'USA', guestCount: 1, bedroomCount: 1,
          bedCount: 1, bathroomCount: 1, amenities: [], listingPhotoPaths: [],
          description: '', highlight: '', highlightDesc: '', price: 100,
        )
      ];

      when(() => mockGetListingsUseCase.call(category: null, type: null))
          .thenAnswer((_) async => listings);

      final expectedResponse = [
        isA<HomeLoading>(),
        HomeListingsLoaded(listings),
      ];

      expectLater(homeCubit.stream, emitsInOrder(expectedResponse));

      homeCubit.loadData();
    });

    test('emits [HomeLoading, HomeRoommatesLoaded] when loadData is called for Shared Room', () async {
      final posts = [
        RoommatePost(
          id: '1', userId: 'user1', city: 'NY', province: 'NY', country: 'USA',
          budgetMin: 100, budgetMax: 500, moveInDate: DateTime.now(),
          description: 'Looking for a room', status: RoommatePostStatus.active,
          postType: RoommatePostType.seeker, title: 'Title', createdAt: DateTime.now(),
        )
      ];

      when(() => mockGetRoommatePostsUseCase.call())
          .thenAnswer((_) async => posts);

      final expectedResponse = [
        isA<HomeLoading>(),
        HomeRoommatesLoaded(posts),
      ];

      expectLater(homeCubit.stream, emitsInOrder(expectedResponse));

      homeCubit.setFilter('All', 'A Shared Room');
    });

    test('emits [HomeLoading, HomeError] when loadData fails', () async {
      final exception = Exception('Failed to load listings');

      when(() => mockGetListingsUseCase.call(category: null, type: null))
          .thenThrow(exception);

      final expectedResponse = [
        isA<HomeLoading>(),
        isA<HomeError>(),
      ];

      expectLater(homeCubit.stream, emitsInOrder(expectedResponse));

      homeCubit.loadData();
    });
  });
}
