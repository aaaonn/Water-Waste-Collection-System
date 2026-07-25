import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/water_garbage_collection/domain/entities/household.dart';
import 'package:my_app/features/water_garbage_collection/domain/repositories/household_repository.dart';
import 'package:my_app/features/water_garbage_collection/presentation/state/household_state.dart';

// 1. สร้าง Fake Repository เพื่อใช้ทดสอบแทนการต่อ API จริง
class FakeHouseholdRepository implements HouseholdRepository {
  List<Household> mockHouseholds = [];
  bool saveSurveyCalled = false;
  bool payBillCalled = false;

  @override
  Future<List<Map<String, dynamic>>> getVillages() async {
    return [
      {'id': 1, 'village_name': 'หมู่บ้านผักบุ้ง'},
      {'id': 2, 'village_name': 'หมู่บ้านมะขาม'},
    ];
  }

  @override
  Future<List<Household>> getHouseholds({
    required String query,
    required String villageName,
    required int villageId,
    required int month,
    required int year,
  }) async {
    return mockHouseholds;
  }

  @override
  Future<List<Map<String, dynamic>>> getGarbageRates() async {
    return [
      {'id': 10, 'subdistrict_id': 1, 'size_name': 'ถังขยะ 20L', 'cost': 40.0},
    ];
  }

  @override
  Future<List<Map<String, dynamic>>> getWaterUnits() async {
    return [
      {'id': 20, 'unit_name': 'หน่วยปกติ'},
    ];
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
    saveSurveyCalled = true;
    return 'invoice-12345';
  }

  @override
  Future<void> payBill({
    required String id,
    required String paymentMethod,
    String? invoiceId,
  }) async {
    payBillCalled = true;
  }
}

void main() {
  group('HouseholdState business logic tests', () {
    late HouseholdState state;
    late FakeHouseholdRepository fakeRepo;

    setUp(() {
      state = HouseholdState();
      fakeRepo = FakeHouseholdRepository();
      state.setRepositoryForTesting(fakeRepo);
      state.resetVillagesOnLogout();
    });

    test('initial values and variables are correct', () {
      expect(state.selectedVillage, 'ทุกหมู่บ้าน');
      expect(state.isSyncing, false);
      expect(state.hasUnsyncedData, false);
      expect(state.households, isEmpty);
    });

    test('fetchVillages loads village list and configures mapping correctly', () async {
      await state.fetchVillages();

      expect(state.villages.length, 3); // 'ทุกหมู่บ้าน' + 2 villages from fakeRepo
      expect(state.villages[1], 'หมู่บ้านผักบุ้ง');
      expect(state.villages[2], 'หมู่บ้านมะขาม');
    });

    test('fetchHouseholds updates state with repository results', () async {
      fakeRepo.mockHouseholds = [
        Household(
          id: '1',
          houseNumber: '101/1',
          ownerName: 'สมใจ',
          village: 'หมู่บ้านผักบุ้ง',
          status: HouseholdStatus.notSurveyed,
          previousMeter: 120.0,
        ),
      ];

      await state.fetchHouseholds();

      expect(state.households.length, 1);
      expect(state.households[0].ownerName, 'สมใจ');
      expect(state.totalCount, 1);
      expect(state.notSurveyedCount, 1);
      expect(state.completedCount, 0);
    });

    test('submitSurvey updates household status and triggers saveSurvey on repository', () async {
      fakeRepo.mockHouseholds = [
        Household(
          id: '1',
          houseNumber: '101/1',
          ownerName: 'สมใจ',
          village: 'หมู่บ้านผักบุ้ง',
          status: HouseholdStatus.notSurveyed,
          previousMeter: 120.0,
        ),
      ];
      await state.fetchHouseholds();

      // สั่งดึงข้อมูลอัตราค่าบริการเพื่อให้ submitSurvey ทำงานได้
      await state.fetchGarbageRates();

      final result = await state.submitSurvey(
        id: '1',
        currentMeter: 130.0,
        binCountsByID: {10: 1},
      );

      expect(result, isNull); // isNull means success
      expect(fakeRepo.saveSurveyCalled, true);
      expect(state.households[0].status, HouseholdStatus.surveyedUnpaid);
      expect(state.unpaidCount, 1);
    });

    test('payBill updates local list status to paid and logs recent activity', () async {
      fakeRepo.mockHouseholds = [
        Household(
          id: '2',
          houseNumber: '102/2',
          ownerName: 'สมร',
          village: 'หมู่บ้านมะขาม',
          status: HouseholdStatus.surveyedUnpaid,
          previousMeter: 200.0,
          totalAmount: 100.0,
          invoiceId: 'invoice-12345',
        ),
      ];
      await state.fetchHouseholds();

      final success = await state.payBill('2', 'Cash');

      expect(success, true);
      expect(fakeRepo.payBillCalled, true);
      expect(state.households[0].status, HouseholdStatus.paid);
      expect(state.completedCount, 1);
      expect(state.recentActivities.length, 1);
      expect(state.recentActivities[0]['ownerName'], 'สมร');
    });
  });
}
