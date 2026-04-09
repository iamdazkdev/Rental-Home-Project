// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format width=80

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;

import '../../features/auth/data/datasources/auth_remote_datasource.dart'
    as _i161;
import '../../features/auth/data/repositories/auth_repository_impl.dart'
    as _i153;
import '../../features/auth/domain/repositories/auth_repository.dart' as _i787;
import '../../features/auth/domain/usecases/auth_usecases.dart' as _i46;
import '../../features/auth/presentation/cubit/auth_bloc.dart' as _i294;
import '../../features/booking/data/datasources/booking_remote_datasource.dart'
    as _i810;
import '../../features/booking/data/repositories/booking_repository_impl.dart'
    as _i265;
import '../../features/booking/domain/repositories/i_booking_repository.dart'
    as _i740;
import '../../features/booking/domain/usecases/booking_usecases.dart' as _i1015;
import '../../features/booking/presentation/cubit/booking_cubit.dart' as _i329;
import '../../features/home/data/repositories/home_repository_impl.dart'
    as _i76;
import '../../features/home/domain/repositories/home_repository.dart' as _i0;
import '../../features/home/domain/usecases/home_usecases.dart' as _i465;
import '../../features/home/presentation/cubit/home_cubit.dart' as _i9;

extension GetItInjectableX on _i174.GetIt {
// initializes the registration of main-scope dependencies inside of GetIt
  _i174.GetIt init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) {
    final gh = _i526.GetItHelper(
      this,
      environment,
      environmentFilter,
    );
    gh.lazySingleton<_i0.IHomeRepository>(() => _i76.HomeRepositoryImpl());
    gh.lazySingleton<_i810.BookingRemoteDataSource>(
        () => _i810.BookingRemoteDataSourceImpl());
    gh.lazySingleton<_i740.IBookingRepository>(
        () => _i265.BookingRepositoryImpl(gh<_i810.BookingRemoteDataSource>()));
    gh.lazySingleton<_i161.IAuthRemoteDataSource>(
        () => _i161.AuthRemoteDataSourceImpl());
    gh.factory<_i465.GetListingsUseCase>(
        () => _i465.GetListingsUseCase(gh<_i0.IHomeRepository>()));
    gh.factory<_i465.GetRoommatePostsUseCase>(
        () => _i465.GetRoommatePostsUseCase(gh<_i0.IHomeRepository>()));
    gh.lazySingleton<_i787.IAuthRepository>(
        () => _i153.AuthRepositoryImpl(gh<_i161.IAuthRemoteDataSource>()));
    gh.factory<_i1015.CreateCashBookingUseCase>(
        () => _i1015.CreateCashBookingUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.CreateBookingIntentUseCase>(() =>
        _i1015.CreateBookingIntentUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.InitiateVNPayPaymentUseCase>(() =>
        _i1015.InitiateVNPayPaymentUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.HandlePaymentCallbackUseCase>(() =>
        _i1015.HandlePaymentCallbackUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.GetUserTripsUseCase>(
        () => _i1015.GetUserTripsUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.CheckAvailabilityUseCase>(
        () => _i1015.CheckAvailabilityUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i1015.CancelBookingIntentUseCase>(() =>
        _i1015.CancelBookingIntentUseCase(gh<_i740.IBookingRepository>()));
    gh.factory<_i46.LoginUseCase>(
        () => _i46.LoginUseCase(gh<_i787.IAuthRepository>()));
    gh.factory<_i46.LogoutUseCase>(
        () => _i46.LogoutUseCase(gh<_i787.IAuthRepository>()));
    gh.factory<_i46.GetCurrentUserUseCase>(
        () => _i46.GetCurrentUserUseCase(gh<_i787.IAuthRepository>()));
    gh.factory<_i329.BookingCubit>(() => _i329.BookingCubit(
          gh<_i1015.CreateCashBookingUseCase>(),
          gh<_i1015.CreateBookingIntentUseCase>(),
          gh<_i1015.InitiateVNPayPaymentUseCase>(),
          gh<_i1015.HandlePaymentCallbackUseCase>(),
          gh<_i1015.GetUserTripsUseCase>(),
          gh<_i1015.CancelBookingIntentUseCase>(),
        ));
    gh.factory<_i9.HomeCubit>(() => _i9.HomeCubit(
          gh<_i465.GetListingsUseCase>(),
          gh<_i465.GetRoommatePostsUseCase>(),
        ));
    gh.factory<_i294.AuthBloc>(() => _i294.AuthBloc(
          gh<_i46.LoginUseCase>(),
          gh<_i46.LogoutUseCase>(),
          gh<_i46.GetCurrentUserUseCase>(),
        ));
    return this;
  }
}
