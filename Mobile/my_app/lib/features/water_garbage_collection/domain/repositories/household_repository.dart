import '../entities/household.dart';

abstract class HouseholdRepository {
  Future<List<Household>> getHouseholds({
    required String query,
    required String villageName,
    required int villageId,
    required int month,
    required int year,
  });
  Future<String> saveSurvey({
    required String id,
    required double currentMeter,
    required Map<int, int> binCountsByID,
    required Map<String, int> garbageBins,
    required int month,
    required int year,
  });
  Future<void> payBill({
    required String id,
    required String paymentMethod,
    required String? invoiceId,
  });
  Future<List<Map<String, dynamic>>> getVillages();
  Future<List<Map<String, dynamic>>> getGarbageRates();
  Future<List<Map<String, dynamic>>> getWaterUnits();
}
