import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:rental_home/features/booking/domain/entities/booking_intent_entity.dart';
import 'package:rental_home/features/booking/domain/entities/booking_entity.dart';
import 'package:rental_home/features/booking/domain/usecases/booking_usecases.dart';
import 'package:rental_home/features/booking/presentation/cubit/booking_cubit.dart';
import 'package:rental_home/features/booking/presentation/cubit/booking_state.dart';

class MockCreateCashBookingUseCase extends Mock implements CreateCashBookingUseCase {}
class MockCreateBookingIntentUseCase extends Mock implements CreateBookingIntentUseCase {}
class MockInitiateVNPayPaymentUseCase extends Mock implements InitiateVNPayPaymentUseCase {}
class MockHandlePaymentCallbackUseCase extends Mock implements HandlePaymentCallbackUseCase {}
class MockGetUserTripsUseCase extends Mock implements GetUserTripsUseCase {}
class MockCancelBookingIntentUseCase extends Mock implements CancelBookingIntentUseCase {}

class FakeBookingIntentEntity extends Fake implements BookingIntentEntity {}

void main() {
  late MockCreateCashBookingUseCase mockCreateCashBookingUseCase;
  late MockCreateBookingIntentUseCase mockCreateBookingIntentUseCase;
  late MockInitiateVNPayPaymentUseCase mockInitiateVNPayPaymentUseCase;
  late MockHandlePaymentCallbackUseCase mockHandlePaymentCallbackUseCase;
  late MockGetUserTripsUseCase mockGetUserTripsUseCase;
  late MockCancelBookingIntentUseCase mockCancelBookingIntentUseCase;
  late BookingCubit cubit;

  setUpAll(() {
    registerFallbackValue(FakeBookingIntentEntity());
  });

  setUp(() {
    mockCreateCashBookingUseCase = MockCreateCashBookingUseCase();
    mockCreateBookingIntentUseCase = MockCreateBookingIntentUseCase();
    mockInitiateVNPayPaymentUseCase = MockInitiateVNPayPaymentUseCase();
    mockHandlePaymentCallbackUseCase = MockHandlePaymentCallbackUseCase();
    mockGetUserTripsUseCase = MockGetUserTripsUseCase();
    mockCancelBookingIntentUseCase = MockCancelBookingIntentUseCase();

    cubit = BookingCubit(
      mockCreateCashBookingUseCase,
      mockCreateBookingIntentUseCase,
      mockInitiateVNPayPaymentUseCase,
      mockHandlePaymentCallbackUseCase,
      mockGetUserTripsUseCase,
      mockCancelBookingIntentUseCase,
    );
  });

  tearDown(() {
    cubit.close();
  });

  group('createBookingIntent', () {
    final tStartDate = DateTime.now();
    final tEndDate = DateTime.now().add(const Duration(days: 2));
    
    final tBookingEntity = BookingEntity(
      id: 'cash_booking_1',
      customerId: 'user_1',
      hostId: 'host_1',
      listingId: 'listing_1',
      startDate: tStartDate,
      endDate: tEndDate,
      totalPrice: 1000,
      bookingStatus: 'approved',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      paymentType: 'cash',
    );

    final tBookingIntentEntity = BookingIntentEntity(
      id: 'intent_1',
      intentId: 'intent_1',
      customerId: 'user_1',
      hostId: 'host_1',
      listingId: 'listing_1',
      startDate: tStartDate,
      endDate: tEndDate,
      totalPrice: 1000,
      status: 'locked',
      paymentMethod: 'vnpay',
      paymentType: 'full',
      paymentAmount: 1000,
      lockedAt: DateTime.now(),
      expiresAt: DateTime.now().add(const Duration(minutes: 10)),
    );

    test('emits [BookingLoading, BookingConfirmed] when cash payment succeeds', () async {
      when(() => mockCreateCashBookingUseCase(
            listingId: any(named: 'listingId'),
            hostId: any(named: 'hostId'),
            startDate: any(named: 'startDate'),
            endDate: any(named: 'endDate'),
            totalPrice: any(named: 'totalPrice'),
          )).thenAnswer((_) async => tBookingEntity);

      final expectedStates = [
        const BookingLoading(message: 'Reserving listing...'),
        BookingConfirmed(booking: tBookingEntity),
      ];

      expectLater(cubit.stream, emitsInOrder(expectedStates));

      await cubit.createBookingIntent(
        listingId: 'listing_1',
        hostId: 'host_1',
        checkIn: tStartDate,
        checkOut: tEndDate,
        totalPrice: 1000,
        paymentType: 'cash',
      );

      verify(() => mockCreateCashBookingUseCase(
            listingId: 'listing_1',
            hostId: 'host_1',
            startDate: tStartDate,
            endDate: tEndDate,
            totalPrice: 1000,
          )).called(1);
    });

    test('emits [BookingLoading, BookingIntentCreated] when vnpay payment intent is created successfully', () async {
      when(() => mockCreateBookingIntentUseCase(
            listingId: any(named: 'listingId'),
            hostId: any(named: 'hostId'),
            startDate: any(named: 'startDate'),
            endDate: any(named: 'endDate'),
            totalPrice: any(named: 'totalPrice'),
            paymentType: any(named: 'paymentType'),
          )).thenAnswer((_) async => tBookingIntentEntity);

      final expectedStates = [
        const BookingLoading(message: 'Reserving listing...'),
        isA<BookingIntentCreated>(),
      ];

      expectLater(cubit.stream, emitsInOrder(expectedStates));

      await cubit.createBookingIntent(
        listingId: 'listing_1',
        hostId: 'host_1',
        checkIn: tStartDate,
        checkOut: tEndDate,
        totalPrice: 1000,
        paymentType: 'full',
      );
    });
  });
}
