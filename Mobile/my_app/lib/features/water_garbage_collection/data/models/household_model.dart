import '../../domain/entities/household.dart';
import '../../../../core/utils/thai_date_utils.dart';

class HouseholdModel extends Household {
  HouseholdModel({
    required super.id,
    required super.houseNumber,
    required super.ownerName,
    required super.village,
    super.status,
    required super.previousMeter,
    super.currentMeter,
    super.garbageBins,
    super.waterBillAmount,
    super.garbageBillAmount,
    super.totalAmount,
    super.paymentMethod,
    super.paymentTime,
    super.invoiceId,
    super.receiptNumber,
    super.qrCodeUrl,
    super.organizationName,
    super.organizationAddress,
    super.organizationPhone,
    super.waterUserId,
    super.householdFullAddress,
    super.villageNumber,
    super.waterUnitConsumed,
    super.waterStartDate,
    super.waterEndDate,
    super.garbageDetails,
    super.billMonth,
    super.staffName,
  });

  factory HouseholdModel.fromJson(Map<String, dynamic> json) {
    // แปลงสถานะจากหลังบ้าน (snake_case string) เป็น enum
    HouseholdStatus statusVal = HouseholdStatus.notSurveyed;
    final backendStatus = json['status'] as String?;
    if (backendStatus == 'paid') {
      statusVal = HouseholdStatus.paid;
    } else if (backendStatus == 'unpaid') {
      statusVal = HouseholdStatus.surveyedUnpaid;
    }

    // Check if the response contains hierarchical details
    final isHierarchical = json['household'] != null;

    final idVal = json['id']?.toString() ?? json['household']?['water_user_id']?.toString() ?? '';
    final houseNumVal = isHierarchical
        ? (json['household']['house_number'] as String? ?? '')
        : (json['house_number'] as String? ?? '');
    final ownerNameVal = isHierarchical
        ? (json['household']['owner_name'] as String? ?? '')
        : (json['owner_name'] as String? ?? '');
    final villageNameVal = isHierarchical
        ? (json['household']['village_name'] as String? ?? '')
        : (json['village_name'] as String? ?? '');

    final prevMeterVal = isHierarchical
        ? ((json['water_usage']?['prev_reading_value'] as num?)?.toDouble() ?? 0.0)
        : ((json['previous_meter'] as num?)?.toDouble() ?? 0.0);
    final currMeterVal = isHierarchical
        ? (json['water_usage']?['curr_reading_value'] != null ? (json['water_usage']?['curr_reading_value'] as num).toDouble() : null)
        : (json['current_meter'] != null ? (json['current_meter'] as num).toDouble() : null);

    final waterAmtVal = isHierarchical
        ? ((json['water_usage']?['water_bill_amount'] as num?)?.toDouble() ?? 0.0)
        : ((json['water_bill_amount'] as num?)?.toDouble() ?? 0.0);
    final garbageAmtVal = isHierarchical
        ? ((json['garbage_usage']?['total_amount'] as num?)?.toDouble() ?? 0.0)
        : ((json['garbage_bill_amount'] as num?)?.toDouble() ?? 0.0);
    final totalAmtVal = (json['total_amount'] as num?)?.toDouble() ?? 0.0;

    final Map<String, int> binsVal;
    if (isHierarchical && json['garbage_usage']?['details'] != null) {
      binsVal = {};
      final details = json['garbage_usage']['details'] as List;
      for (var d in details) {
        final sizeName = d['size_name'] as String? ?? '';
        final amount = d['amount'] as int? ?? 0;
        binsVal[ThaiDateUtils.mapSizeKey(sizeName)] = amount;
      }
    } else {
      binsVal = json['garbage_bins'] != null 
          ? Map<String, int>.from(json['garbage_bins'] as Map)
          : const {"20L": 1};
    }

    final payMethodVal = json['payment_method'] as String?;
    final payTimeVal = json['paid_at'] != null 
        ? DateTime.parse(json['paid_at'] as String) 
        : (json['payment_time'] != null 
            ? DateTime.parse(json['payment_time'] as String) 
            : (json['receipt_date'] != null 
                ? DateTime.parse(json['receipt_date'] as String) 
                : null));

    return HouseholdModel(
      id: idVal,
      houseNumber: houseNumVal,
      ownerName: ownerNameVal,
      village: villageNameVal,
      status: statusVal,
      previousMeter: prevMeterVal,
      currentMeter: currMeterVal,
      garbageBins: binsVal,
      waterBillAmount: waterAmtVal,
      garbageBillAmount: garbageAmtVal,
      totalAmount: totalAmtVal,
      paymentMethod: payMethodVal,
      paymentTime: payTimeVal,
      invoiceId: json['invoice_id']?.toString(),
      receiptNumber: json['receipt_number'] as String?,
      qrCodeUrl: json['qr_code_url'] as String?,
      organizationName: json['organization']?['name'] as String?,
      organizationAddress: json['organization']?['address'] as String?,
      organizationPhone: json['organization']?['phone_number'] as String?,
      waterUserId: json['household']?['water_user_id'] as String?,
      householdFullAddress: json['household']?['full_address'] as String?,
      villageNumber: json['household']?['village_number'] as int?,
      waterUnitConsumed: (json['water_usage']?['unit_consumed'] as num?)?.toDouble(),
      waterStartDate: json['water_usage']?['start_date'] != null ? DateTime.parse(json['water_usage']?['start_date'] as String) : null,
      waterEndDate: json['water_usage']?['end_date'] != null ? DateTime.parse(json['water_usage']?['end_date'] as String) : null,
      garbageDetails: json['garbage_usage']?['details'] != null
          ? List<Map<String, dynamic>>.from((json['garbage_usage']?['details'] as List).map((x) => Map<String, dynamic>.from(x as Map)))
          : null,
      billMonth: json['bill_month'] as String?,
      staffName: json['staff_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'house_number': houseNumber,
      'owner_name': ownerName,
      'village_name': village,
      'status': status == HouseholdStatus.paid 
          ? 'paid' 
          : (status == HouseholdStatus.surveyedUnpaid ? 'unpaid' : 'not_surveyed'),
      'previous_meter': previousMeter,
      'current_meter': currentMeter,
      'garbage_bins': garbageBins,
      'water_bill_amount': waterBillAmount,
      'garbage_bill_amount': garbageBillAmount,
      'total_amount': totalAmount,
      'payment_method': paymentMethod,
      'payment_time': paymentTime?.toIso8601String(),
      'invoice_id': invoiceId,
      'receipt_number': receiptNumber,
      'qr_code_url': qrCodeUrl,
      'organization': {
        'name': organizationName,
        'address': organizationAddress,
        'phone_number': organizationPhone,
      },
      'household': {
        'water_user_id': waterUserId,
        'owner_name': ownerName,
        'house_number': houseNumber,
        'village_name': village,
        'village_number': villageNumber,
        'full_address': householdFullAddress,
      },
      'water_usage': {
        'prev_reading_value': previousMeter,
        'curr_reading_value': currentMeter,
        'unit_consumed': waterUnitConsumed,
        'water_bill_amount': waterBillAmount,
        'start_date': waterStartDate?.toIso8601String(),
        'end_date': waterEndDate?.toIso8601String(),
      },
      'garbage_usage': {
        'total_amount': garbageBillAmount,
        'details': garbageDetails,
      },
      'bill_month': billMonth,
      'staff_name': staffName,
    };
  }

  // แปลงจาก Entity ทั่วไปเป็น Model
  factory HouseholdModel.fromEntity(Household entity) {
    return HouseholdModel(
      id: entity.id,
      houseNumber: entity.houseNumber,
      ownerName: entity.ownerName,
      village: entity.village,
      status: entity.status,
      previousMeter: entity.previousMeter,
      currentMeter: entity.currentMeter,
      garbageBins: entity.garbageBins,
      waterBillAmount: entity.waterBillAmount,
      garbageBillAmount: entity.garbageBillAmount,
      totalAmount: entity.totalAmount,
      paymentMethod: entity.paymentMethod,
      paymentTime: entity.paymentTime,
      invoiceId: entity.invoiceId,
      receiptNumber: entity.receiptNumber,
      qrCodeUrl: entity.qrCodeUrl,
      organizationName: entity.organizationName,
      organizationAddress: entity.organizationAddress,
      organizationPhone: entity.organizationPhone,
      waterUserId: entity.waterUserId,
      householdFullAddress: entity.householdFullAddress,
      villageNumber: entity.villageNumber,
      waterUnitConsumed: entity.waterUnitConsumed,
      waterStartDate: entity.waterStartDate,
      waterEndDate: entity.waterEndDate,
      garbageDetails: entity.garbageDetails,
      billMonth: entity.billMonth,
      staffName: entity.staffName,
    );
  }
}
