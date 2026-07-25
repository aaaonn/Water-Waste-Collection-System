import 'package:flutter/foundation.dart';
import '../../domain/entities/household.dart';
import '../../domain/repositories/household_repository.dart';
import '../datasources/remote/remote_data_source.dart';

class HouseholdRepositoryImpl implements HouseholdRepository {
  final RemoteDataSource remoteDataSource;

  HouseholdRepositoryImpl({
    required this.remoteDataSource,
  });

  @override
  Future<List<Household>> getHouseholds({
    required String query,
    required String villageName,
    required int villageId,
    required int month,
    required int year,
  }) async {
    try {
      return await remoteDataSource.fetchHouseholds(
        villageId: villageId,
        month: month,
        year: year,
      );
    } catch (e) {
      debugPrint("Repository getHouseholds remote error: $e");
      return [];
    }
  }

  @override
  Future<String> saveSurvey({
    required String id,
    required double currentMeter,
    required Map<int, int> binCountsByID,
    required Map<String, int> garbageBins,
    required int month,
    required int year,
  }) async {
    final success = await remoteDataSource.submitSurvey(
      id: id,
      currentMeter: currentMeter,
      binCountsByID: binCountsByID,
      month: month,
      year: year,
    );
    if (success) {
      final detail = await remoteDataSource.fetchHouseholdDetail(
        id,
        HouseholdStatus.surveyedUnpaid,
        month,
        year,
      );
      final realId = detail?.invoiceId;
      if (realId != null && realId.isNotEmpty) {
        return realId;
      }
    }
    throw Exception('Failed to submit survey');
  }

  @override
  Future<void> payBill({
    required String id,
    required String paymentMethod,
    required String? invoiceId,
  }) async {
    final invId = invoiceId ?? '0';
    if (paymentMethod == 'cash' && invId != '0') {
      final success = await remoteDataSource.payBillCash(invId);
      if (!success) {
        throw Exception('Failed to record cash payment on server');
      }
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getVillages() async {
    return await remoteDataSource.fetchVillages();
  }

  @override
  Future<List<Map<String, dynamic>>> getGarbageRates() async {
    return await remoteDataSource.fetchGarbageRates();
  }

  @override
  Future<List<Map<String, dynamic>>> getWaterUnits() async {
    return await remoteDataSource.fetchWaterUnits();
  }
}
