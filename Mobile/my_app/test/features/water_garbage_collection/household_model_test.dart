import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/water_garbage_collection/data/models/household_model.dart';
import 'package:my_app/features/water_garbage_collection/domain/entities/household.dart';

void main() {
  group('HouseholdModel Serialization Tests', () {
    test('fromJson parses hierarchical JSON correctly', () {
      final jsonMap = {
        "id": 101,
        "status": "paid",
        "total_amount": 150.00,
        "invoice_id": "inv-001",
        "receipt_number": "rc-001",
        "payment_method": "PromptPay",
        "paid_at": "2026-06-14T10:00:00Z",
        "household": {
          "water_user_id": "wu-101",
          "owner_name": "นายสมชาย ใจดี",
          "house_number": "12/3",
          "village_name": "หมู่บ้านหนองผักบุ้ง",
          "village_number": 4,
          "full_address": "12/3 ม.4 ต.ทุ่งหลวง อ.ปากท่อ จ.ราชบุรี"
        },
        "water_usage": {
          "prev_reading_value": 150.0,
          "curr_reading_value": 165.0,
          "unit_consumed": 15.0,
          "water_bill_amount": 60.0,
          "start_date": "2026-05-14T00:00:00Z",
          "end_date": "2026-06-14T00:00:00Z"
        },
        "garbage_usage": {
          "total_amount": 90.0,
          "details": [
            {
              "size_name": "ถังขยะขนาด 20 ลิตร",
              "amount": 2
            },
            {
              "size_name": "ถังขยะขนาด 120 ลิตร",
              "amount": 1
            }
          ]
        },
        "organization": {
          "name": "อบต.ทุ่งหลวง",
          "address": "ตำบลทุ่งหลวง",
          "phone_number": "032-123456"
        },
        "bill_month": "มิถุนายน 2569",
        "staff_name": "นายสมยศ"
      };

      final model = HouseholdModel.fromJson(jsonMap);

      expect(model.id, '101');
      expect(model.houseNumber, '12/3');
      expect(model.ownerName, 'นายสมชาย ใจดี');
      expect(model.village, 'หมู่บ้านหนองผักบุ้ง');
      expect(model.status, HouseholdStatus.paid);
      expect(model.previousMeter, 150.0);
      expect(model.currentMeter, 165.0);
      expect(model.waterBillAmount, 60.0);
      expect(model.garbageBillAmount, 90.0);
      expect(model.totalAmount, 150.0);
      expect(model.paymentMethod, 'PromptPay');
      expect(model.paymentTime, DateTime.parse("2026-06-14T10:00:00Z"));
      expect(model.invoiceId, 'inv-001');
      expect(model.receiptNumber, 'rc-001');
      expect(model.organizationName, 'อบต.ทุ่งหลวง');
      expect(model.waterUserId, 'wu-101');
      expect(model.householdFullAddress, '12/3 ม.4 ต.ทุ่งหลวง อ.ปากท่อ จ.ราชบุรี');
      expect(model.villageNumber, 4);

      // ตรวจสอบการแมปขนาดถังขยะที่พาร์สด้วย ThaiDateUtils.mapSizeKey
      expect(model.garbageBins, containsPair('20L', 2));
      expect(model.garbageBins, containsPair('120L', 1));
    });

    test('fromJson parses flat JSON correctly', () {
      final jsonMap = {
        "id": "102",
        "status": "unpaid",
        "total_amount": 80.00,
        "house_number": "45/1",
        "owner_name": "นางสาวสมศรี สวยงาม",
        "village_name": "หมู่บ้านหนองมะขาม",
        "previous_meter": 200.0,
        "current_meter": 210.0,
        "water_bill_amount": 40.0,
        "garbage_bill_amount": 40.0,
        "garbage_bins": {
          "20L": 1,
          "60L": 1
        },
        "invoice_id": "inv-002",
        "receipt_number": null,
        "qr_code_url": "https://promptpay.io/qr.png"
      };

      final model = HouseholdModel.fromJson(jsonMap);

      expect(model.id, '102');
      expect(model.houseNumber, '45/1');
      expect(model.ownerName, 'นางสาวสมศรี สวยงาม');
      expect(model.village, 'หมู่บ้านหนองมะขาม');
      expect(model.status, HouseholdStatus.surveyedUnpaid);
      expect(model.previousMeter, 200.0);
      expect(model.currentMeter, 210.0);
      expect(model.waterBillAmount, 40.0);
      expect(model.garbageBillAmount, 40.0);
      expect(model.totalAmount, 80.0);
      expect(model.paymentMethod, isNull);
      expect(model.invoiceId, 'inv-002');
      expect(model.receiptNumber, isNull);
      expect(model.qrCodeUrl, 'https://promptpay.io/qr.png');
      expect(model.garbageBins, containsPair('20L', 1));
      expect(model.garbageBins, containsPair('60L', 1));
    });

    test('toJson returns correct Map representations', () {
      final model = HouseholdModel(
        id: '99',
        houseNumber: '10/2',
        ownerName: 'สมยศ ดีเด่น',
        village: 'บ้านห้วยแห้ง',
        status: HouseholdStatus.notSurveyed,
        previousMeter: 100.0,
        currentMeter: 105.0,
        totalAmount: 20.0,
        waterBillAmount: 20.0,
        garbageBillAmount: 0.0,
        garbageBins: {'20L': 0},
      );

      final json = model.toJson();

      expect(json['id'], '99');
      expect(json['house_number'], '10/2');
      expect(json['owner_name'], 'สมยศ ดีเด่น');
      expect(json['village_name'], 'บ้านห้วยแห้ง');
      expect(json['status'], 'not_surveyed');
      expect(json['previous_meter'], 100.0);
      expect(json['current_meter'], 105.0);
      expect(json['total_amount'], 20.0);
      expect(json['water_bill_amount'], 20.0);
      expect(json['garbage_bill_amount'], 0.0);
      expect(json['garbage_bins'], containsPair('20L', 0));
    });

    test('fromEntity maps fields properly', () {
      final entity = Household(
        id: 'entity-id',
        houseNumber: '1/1',
        ownerName: 'นางแช่ม',
        village: 'หมู่บ้านหนองผักบุ้ง',
        status: HouseholdStatus.paid,
        previousMeter: 50.0,
        currentMeter: 55.0,
        garbageBins: {'20L': 1},
        waterBillAmount: 20.0,
        garbageBillAmount: 40.0,
        totalAmount: 60.0,
      );

      final model = HouseholdModel.fromEntity(entity);

      expect(model.id, entity.id);
      expect(model.houseNumber, entity.houseNumber);
      expect(model.ownerName, entity.ownerName);
      expect(model.village, entity.village);
      expect(model.status, entity.status);
      expect(model.previousMeter, entity.previousMeter);
      expect(model.currentMeter, entity.currentMeter);
      expect(model.garbageBins, entity.garbageBins);
      expect(model.waterBillAmount, entity.waterBillAmount);
      expect(model.garbageBillAmount, entity.garbageBillAmount);
      expect(model.totalAmount, entity.totalAmount);
    });
  });
}
