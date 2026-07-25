enum HouseholdStatus {
  notSurveyed,
  surveyedUnpaid,
  paid,
}

class Household {
  final String id; // รหัสครัวเรือนในฐานข้อมูล (Database ID)
  final String houseNumber; // บ้านเลขที่ เช่น "124/5"
  final String ownerName; // ชื่อเจ้าของบ้าน เช่น "นายสมชาย ใจดี"
  final String village; // ชื่อหมู่บ้าน เช่น "บ้านปราสาทเบง"
  
  HouseholdStatus status;
  double previousMeter; // มาตรน้ำครั้งก่อน
  double? currentMeter; // มาตรน้ำครั้งนี้
  Map<String, int> garbageBins; // ขนาดและจำนวนถังขยะ: {"20L": 1, "60L": 2}
  
  double waterBillAmount; // ค่าน้ำประปา
  double garbageBillAmount; // ค่าเก็บขยะ
  double totalAmount; // ยอดรวม
  
  String? invoiceId;
  String? paymentMethod; // "cash" หรือ "promptpay"
  DateTime? paymentTime;
  String? receiptNumber;
  String? qrCodeUrl;
  
  // Fields for hierarchical invoice/receipt mapping
  String? organizationName;
  String? organizationAddress;
  String? organizationPhone;
  String? waterUserId;
  String? householdFullAddress;
  int? villageNumber;
  double? waterUnitConsumed;
  DateTime? waterStartDate;
  DateTime? waterEndDate;
  List<Map<String, dynamic>>? garbageDetails;
  String? billMonth;
  String? staffName;

  Household({
    required this.id,
    required this.houseNumber,
    required this.ownerName,
    required this.village,
    this.status = HouseholdStatus.notSurveyed,
    required this.previousMeter,
    this.currentMeter,
    this.garbageBins = const {"20L": 1},
    this.waterBillAmount = 0.0,
    this.garbageBillAmount = 0.0,
    this.totalAmount = 0.0,
    this.paymentMethod,
    this.paymentTime,
    this.invoiceId,
    this.receiptNumber,
    this.qrCodeUrl,
    this.organizationName,
    this.organizationAddress,
    this.organizationPhone,
    this.waterUserId,
    this.householdFullAddress,
    this.villageNumber,
    this.waterUnitConsumed,
    this.waterStartDate,
    this.waterEndDate,
    this.garbageDetails,
    this.billMonth,
    this.staffName,
  });

  // Getter สำหรับความเข้ากันได้ย้อนหลัง
  String get garbageBinSize {
    final activeBins = garbageBins.entries.where((e) => e.value > 0).toList();
    if (activeBins.isEmpty) return "ไม่มี";
    return activeBins.first.key;
  }

  int get garbageBinCount {
    return garbageBins.values.fold(0, (sum, count) => sum + count);
  }

  // คำอธิบายถังขยะทั้งหมด เช่น "20L (x1), 60L (x2)"
  String get garbageBinDescription {
    final activeBins = garbageBins.entries.where((e) => e.value > 0).toList();
    if (activeBins.isEmpty) return "ไม่มีถังขยะ";
    return activeBins.map((e) => "${e.key} (x${e.value})").join(", ");
  }

  // กำหนดค่าน้ำประปาและค่าขยะที่คำนวณมาแล้ว
  void applyCharges({
    required double current,
    required Map<String, int> bins,
    required double waterBill,
    required double garbageBill,
  }) {
    currentMeter = current;
    garbageBins = Map<String, int>.from(bins);
    waterBillAmount = waterBill;
    garbageBillAmount = garbageBill;
    totalAmount = waterBill + garbageBill;
  }
}
